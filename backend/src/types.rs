use std::time::Instant;
use tokio::sync::{mpsc, oneshot};
use serde::{Deserialize, Serialize};

use hyper::Response;
use http_body_util::Full;
use hyper::body::Bytes;

//-----------------------------------------------------------------------------------------------------
//Game types
//-----------------------------------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct FacingAngles {
    pub horizontal: f64,
    pub vertical: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum GameStatus {
    Waiting,
    InProgress,
    Ended,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Winner {
    Hunters,
    Hiders,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MaterialType {
    Concrete,
    Brick,
    Stone,
    Wood,
    Metal,
    RustedMetal,
    Glass,
    Grass,
    Dirt,
    Sand,
    Gravel,
    Asphalt,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Obstacle {
    pub position: Vector3,
    pub width: f64,
    pub height: f64,
    pub depth: f64,
    pub blocks_vision: bool,
    pub blocks_movement: bool,
    pub material: MaterialType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Terrain {
    pub position: Vector3,
    pub rotation: Vector3,
    pub width: f64,
    pub height: f64,
    pub depth: f64,
}

//-----------------------------------------------------------------------------------------------------
//Player struct and views of data for client
//-----------------------------------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct Player {
    pub name: String,
    pub position: Vector3,
    pub facing: FacingAngles,
    pub is_hunter: bool,
    pub is_found: bool,
    pub is_creator: bool,
    pub connected: bool,
    pub disconnected_at: Option<Instant>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OtherPlayerView {
    pub id: String,
    pub name: String,
    pub position: Vector3,
    pub facing: FacingAngles,
    pub is_hunter: bool,
    pub is_found: bool,
}
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerStateView {
    pub is_hunter: bool,
    pub is_found: bool,
}
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayerInitialState {
    pub name: String,
    pub is_hunter: bool,
    pub is_found: bool,
    pub is_creator: bool,
}

impl Player {
    pub fn new(
        name: String,
        position: Vector3, 
        facing: FacingAngles,
        is_hunter: bool,
        is_found: bool,
        is_creator: bool,
        connected: bool,
        disconnected_at: Option<Instant>
    ) -> Self {
        Self {
            name,
            position,
            facing,
            is_hunter,
            is_found,
            is_creator,
            connected,
            disconnected_at,
        }
    }

    pub fn to_initial_state(&self) -> PlayerInitialState {
        PlayerInitialState {
            name: self.name.clone(),
            is_hunter: self.is_hunter,
            is_found: self.is_found,
            is_creator: self.is_creator,
        }
    }

    pub fn to_state_update(&self) -> PlayerStateView {
        PlayerStateView {
            is_hunter: self.is_hunter,
            is_found: self.is_found,
        }
    }

    pub fn to_other_player(&self, id: &str) -> OtherPlayerView {
        OtherPlayerView {
            id: id.to_string(), 
            name: self.name.clone(),
            position: self.position.clone(),
            facing: self.facing.clone(),
            is_hunter: self.is_hunter,
            is_found: self.is_found,
        }
    }
}

//-----------------------------------------------------------------------------------------------------
//Room registry communication
//-----------------------------------------------------------------------------------------------------

pub enum RegistryCommand {
    CheckLobbyExists { room_code: String, reply_tx: oneshot::Sender<bool> },
    CreateLobby { reply_tx: oneshot::Sender<String> },
    GetHandle { room_code: String, reply_tx: oneshot::Sender<Option<RoomHandle>> },
    EndGame { room_code: String },
}
pub type RegistryHandle = mpsc::Sender<RegistryCommand>;
pub type RegistryInbox = mpsc::Receiver<RegistryCommand>;

//-----------------------------------------------------------------------------------------------------
//Room communication protocol
//-----------------------------------------------------------------------------------------------------

pub type RoomInbox = mpsc::Receiver<RoomCommand>;
// What the registry stores for each room: just a way to send it commands.
pub type RoomHandle = mpsc::Sender<RoomCommand>;

pub enum ConsumerCommand {
    Write { message: ServerMessage },
    Kick { message: ServerMessage },
}
pub type ConsumerHandle = mpsc::Sender<ConsumerCommand>;

pub enum RoomCommand {
    Join { player_id: String, name: String, consumer_tx: ConsumerHandle },
    Disconnect { player_id: String },
    Move { player_id: String, position: Vector3, facing: FacingAngles },
    CaptureAttempt { player_id: String, target_id: String },
    KickPlayer { player_id: String, kick_id: String },
    StartGame { player_id: String },
    EndGame { player_id: String },
}

//-----------------------------------------------------------------------------------------------------
//Client communication protocol
//-----------------------------------------------------------------------------------------------------

pub type HttpResponse = Response<Full<Bytes>>;

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ClientMessage {
    Join { name: String },
    Move { position: Vector3, facing: FacingAngles },
    KickPlayer { kick_id: String },
    StartGame,
    EndGame,
    CaptureAttempt { target_id: String },
}

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ServerMessage {
    LobbyResult { room_code: String },
    InitialState {
        status: GameStatus,
        obstacles: Vec<Obstacle>,
        terrain: Vec<Terrain>,

        player: PlayerInitialState,
        position: Vector3,
        facing: FacingAngles,

        other_players: Vec<OtherPlayerView>,
    },
    StateUpdate {
        status: GameStatus,
        player: PlayerStateView,
        other_players: Vec<OtherPlayerView>,
    },
    TimeUpdate { remaining: u64 },
    GameOver { winner: Winner },
    CaptureResult { success: bool, target_name: String },
    Kicked { message: String },
    Error { message: String },
}

//-----------------------------------------------------------------------------------------------------
//Vision engine
//-----------------------------------------------------------------------------------------------------

pub struct Region {
    pub h_start: f64, 
    pub h_end: f64,
    pub v_start: f64,
    pub v_end: f64,
    pub is_obstacle: bool
}


use std::time::{Duration, Instant};
use std::collections::{HashMap, HashSet, VecDeque};
use rand::seq::IndexedRandom;

use crate::types::{
    RoomInbox,
    RoomCommand,
    RegistryHandle,
    RegistryCommand,
    ConsumerHandle,
    ServerMessage,
    ConsumerCommand,
    Obstacle,
    Terrain,
    Vector3,
    FacingAngles,
    GameStatus,
    Winner,
    Player,
    OtherPlayerView,
};
use crate::constants::{
    DEFAULT_OBSTACLES, 
    DEFAULT_TERRAIN, 
    DEFAULT_SPAWN_POSITION,
    RECONNECT_TIMEOUT,
    ROUND_DURATION,
};
use crate::vision::Vision;


pub struct Room<'a> {
    inbox: RoomInbox,
    room_registry_handle: RegistryHandle,
    room_code: String,

    players: HashMap<String, Player>,
    connections: HashMap<String, ConsumerHandle>, 
    disconnect_queue: VecDeque<(Instant, String)>,

    obstacles: &'a [Obstacle],
    terrain: &'a [Terrain],
    spawn_position: &'a Vector3,

    status: GameStatus,
    round_ends_at: Option<Instant>,
}

impl Room<'_> {
    pub fn new(
        inbox: RoomInbox,
        room_registry_handle: RegistryHandle,
        room_code: String,
    ) -> Self {
        Self {
            inbox,
            room_registry_handle,
            room_code,
            players: HashMap::new(),
            connections: HashMap::new(),
            disconnect_queue: VecDeque::new(),
            obstacles: DEFAULT_OBSTACLES,
            terrain: DEFAULT_TERRAIN,
            spawn_position: DEFAULT_SPAWN_POSITION,
            status: GameStatus::Waiting,
            round_ends_at: None,
        }
    }

    //Takes self value, room moves into the spawned task
    pub async fn run(mut self) {
        let mut ticker = tokio::time::interval(Duration::from_secs(1));
        // The room starts empty, so only close it once someone has been in it and everyone left.
        let mut was_occupied = false;

        loop {
            tokio::select! {
                command = self.inbox.recv() => {
                    match command {
                        Some(command) => {
                            self.handle_command(command).await;
                        },
                        None => { // every sender is gone
                            break;
                        }, 
                    }
                }
                _ = ticker.tick() => {
                    self.tick().await;
                },
            }

            if !self.players.is_empty() {
                was_occupied = true;
            } else if was_occupied {
                break;
            }
        }

        if let Err(e) = self.room_registry_handle.send(RegistryCommand::EndGame { room_code: self.room_code }).await {
            eprintln!("Failed to eliminate room from registry: {e}");
        }
    }

    async fn handle_command(&mut self, command: RoomCommand) {
        match command {
            RoomCommand::Join { player_id, name, consumer_tx } => {
                self.add_player(player_id, name, consumer_tx).await;
            },
            RoomCommand::Disconnect { player_id } => {
                self.disconnect_player(player_id);
            },
            RoomCommand::Move { player_id, position, facing } => {
                self.move_player(player_id, position, facing);
            },
            RoomCommand::CaptureAttempt { player_id, target_id } => {
                self.capture_attempt(player_id, target_id).await;
            },

            //Check creator status to call actions
            RoomCommand::KickPlayer { player_id, kick_id } => {
                match self.players.get(&player_id) {
                    Some(player) => {
                        if player.is_creator {
                            self.kick_player(kick_id, "Sei stat* cacciat* dalla lobby".to_string()).await;
                        }
                    },
                    None => {
                        eprintln!("Could not kick player because request did not come from host");
                    }
                }
            },
            RoomCommand::StartGame { player_id } => {
                println!("Room received StartGame from {player_id}");
                match self.players.get(&player_id) {
                    Some(player) => {
                        if player.is_creator {
                            self.start_game().await;
                        }
                    },
                    None => {
                        eprintln!("Could not start game because request did not come from host");
                    }
                }
            },
            RoomCommand::EndGame { player_id } => {
                match self.players.get(&player_id) {
                    Some(player) => {
                        if player.is_creator {
                            self.end_game().await;
                        }
                    },
                    None => {
                        eprintln!("Could not end game because request did not come from host");
                    }
                }
            },
        }
    }

    async fn tick(&mut self) {
        if self.round_ends_at != None {
            let time_left = self.round_ends_at
                .unwrap()
                .saturating_duration_since(Instant::now())
                .as_secs();
            self.broadcast(ServerMessage::TimeUpdate { remaining: time_left }).await;
        }

        let mut removed_any = false;

        while let Some((at, _)) = self.disconnect_queue.front() {
            if at.elapsed() < RECONNECT_TIMEOUT {
                break;
            }

            let (at, id) = match self.disconnect_queue.pop_front() {
                Some(entry) => entry,
                None => break,
            };

            let still_gone = match self.players.get(&id) {
                Some(p) => !p.connected && p.disconnected_at == Some(at),
                None => false,
            };
            if still_gone {
                self.players.remove(&id);
                self.connections.remove(&id);
                removed_any = true;
            }
        }

        if removed_any {
            self.broadcast_state().await;
        }
    }
    //--------------------------------------------------------------------------------------------------------------------
    //Connection handling methods
    //--------------------------------------------------------------------------------------------------------------------

    async fn send_to(&self, id: &str, message: ServerMessage) {
        match self.connections.get(id) {
            Some(channel) => {
                if let Err(_) = channel.send(ConsumerCommand::Write { message }).await {
                    eprintln!("Could not send to {id}, connection gone");
                }
            },
            None => eprintln!("User connection not found: {id}"),
        }
    }

    async fn kick_player(&mut self, id: String, message: String) {
        match self.connections.get(&id) {
            Some(channel) => {
                if let Err(e) = channel.send(ConsumerCommand::Kick {
                    message: ServerMessage::Kicked { message }
                }).await {
                    eprintln!("Error sending kick message to {id}: {e}");
                }
            },
            None => {
                eprintln!("Could not kick {id}, user not found");
                return;
            },
        }

        self.connections.remove(&id);
        self.players.remove(&id);
    }

    async fn broadcast(&self, message: ServerMessage) {
        for (pid, _) in &self.players {
            self.send_to(&pid, message.clone()).await;
        }
    }

    //--------------------------------------------------------------------------------------------------------------------
    //State update functions
    //--------------------------------------------------------------------------------------------------------------------
    
    fn get_other_players(&self, me_id: &str) -> Vec<OtherPlayerView> {
        let mut other_players = Vec::new();
        for (pid, player) in &self.players {
            if pid != me_id && player.connected {
                other_players.push(player.to_other_player(pid));
            } 
        }
        return other_players;
    }

    async fn broadcast_state(&self) {
        for (me_id, me_player) in &self.players {
            if !me_player.connected {
                continue;
            }

            let other_players = self.get_other_players(me_id);
            self.send_to(me_id, ServerMessage::StateUpdate {
                status: self.status.clone(),
                player: me_player.to_state_update(),
                other_players,
            }).await;
        }
    }

    async fn send_initial_state(&self, player_id: &str) {
        let player = match self.players.get(player_id) {
            Some(player) => player,
            None => {
                eprintln!("Player not found");
                return;
            }
        };
        let position = player.position.clone();
        let facing = player.facing.clone();
        let other_players = self.get_other_players(player_id);
        
        self.send_to(player_id, ServerMessage::InitialState {
            status: self.status.clone(),
            obstacles: self.obstacles.to_vec(),
            terrain: self.terrain.to_vec(),
            player: player.to_initial_state(),
            position,
            facing, 
            other_players,
        }).await;
    }

    //--------------------------------------------------------------------------------------------------------------------
    //Player handling
    //--------------------------------------------------------------------------------------------------------------------

    async fn add_player(&mut self, player_id: String, player_name: String, consumer_tx: ConsumerHandle) {
        if self.players.contains_key(&player_id) {
            let existing_player = self.players.get_mut(&player_id).unwrap();
            existing_player.connected = true;
            existing_player.disconnected_at = None;
        } else {
            if self.status == GameStatus::InProgress {
                self.kick_player(player_id, "La partita è già iniziata".to_string()).await;
                return;
            }

            let new_player = Player::new(
                player_name,
                (*self.spawn_position).clone(),
                FacingAngles { horizontal: 0.0, vertical: 0.0 },
                false,
                false,
                self.players.is_empty(),
                true,
                None,
            );

            self.players.insert(player_id.clone(), new_player);
            self.connections.insert(player_id.clone(), consumer_tx);
        }

        self.send_initial_state(&player_id).await;
        self.broadcast_state().await;
    }

    fn disconnect_player(&mut self, player_id: String) {
        let player = match self.players.get_mut(&player_id) {
            Some(player) => player,
            None => {
                eprintln!("Could not disconnect player, they aren't found");
                return;
            },
        };
        let now = Instant::now();
        player.disconnected_at = Some(now);
        self.disconnect_queue.push_back((now, player_id));
    }

    //--------------------------------------------------------------------------------------------------------------------
    //Player action 
    //--------------------------------------------------------------------------------------------------------------------

    fn move_player(&mut self, player_id: String, position: Vector3, facing: FacingAngles) {
        match self.players.get_mut(&player_id) {
            Some(player) => {
                player.position = position;
                player.facing = facing;
            },
            None => return
        }
    }

    async fn capture_attempt(&mut self, player_id: String, target_id: String) {
        if self.status != GameStatus::InProgress {
            return;
        }

        let (hunter_position, hunter_facing) = match self.players.get(&player_id) {
            Some(player) => {
                if !player.is_hunter {
                    return;
                }
                (player.position, player.facing)
            },
            None => {
                return;
            },
        };
        let vision = Vision::new(
            &hunter_position,
            &hunter_facing,
            self.obstacles,
        );

        let target = match self.players.get_mut(&target_id) {
            Some(player) => {
                if player.is_found || player.is_hunter {
                    return;
                }
                player
            },
            None => {
                return;
            },
        };
        let success = vision.is_player_visible(&target);
        target.is_found = success;
        let target_name = target.name.clone().to_string();
        
        self.send_to(&player_id, ServerMessage::CaptureResult {
            success,
            target_name,
        }).await;
        if success {
            if self.game_over() {
                self.end_game().await;
            }
            self.broadcast_state().await;
        }
    }

    //--------------------------------------------------------------------------------------------------------------------
    //Lobby state
    //--------------------------------------------------------------------------------------------------------------------

    fn alive_and_hunters(&self) -> (u32, u32) {
        let mut alive = 0;
        let mut hunters = 0;

        for (_, player) in &self.players {
            if player.is_hunter {
                hunters += 1;
            } else if !player.is_found && player.connected {
                alive += 1;
            }
        }

        return (alive, hunters);
    }
    fn game_over(&self) -> bool {
        let (alive, hunters) = self.alive_and_hunters();
        return alive == 0 || hunters == 0;
    }
    fn hunters_won(&self) -> bool {
        let (alive, hunters) = self.alive_and_hunters();
        return alive == 0 && hunters > 0;
    }

    async fn start_game(&mut self) {
        if self.status == GameStatus::InProgress {
            return
        }

        //copy ids from self.players because we have a mutable reference to self.players after to assign hunter roles
        let player_ids: Vec<String> = self.players
            .iter()
            .filter(|(_, p)| p.connected)
            .map(|(id, _)| id.clone())
            .collect();

        if player_ids.is_empty() {
            return;
        }

        let hunter_ids: HashSet<&String> = {
            let mut rng = rand::rng();
            let num_hunters = (player_ids.len() / 4).max(1);
            player_ids.sample(&mut rng, num_hunters).collect()
        };

        for (pid, player) in self.players.iter_mut() {
            player.is_hunter = hunter_ids.contains(pid);
        }

        self.status = GameStatus::InProgress;
        self.round_ends_at = Some(Instant::now() + ROUND_DURATION);
        self.broadcast_state().await;
    }

    async fn end_game(&mut self) {
        if self.status != GameStatus::InProgress {
            return;
        }

        self.status = GameStatus::Ended;
        self.round_ends_at = None;
        let winner = if self.hunters_won() { Winner::Hunters } else { Winner::Hiders };

        for player in self.players.values_mut() {
            player.is_found = false;
            player.is_hunter = false;
        }

        self.broadcast(ServerMessage::GameOver { winner }).await;
        self.broadcast_state().await;
    }
}

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface FacingAngles {
    horizontal: number;
    vertical: number
}
export interface Movement {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
}

export type MaterialType =
    | "concrete"
    | "brick"
    | "stone"
    | "wood"
    | "metal"
    | "rustedMetal"
    | "glass"
    | "grass"
    | "dirt"
    | "sand"
    | "gravel"
    | "asphalt";

export interface Obstacle {
    position: Vector3
    width: number
    height: number
    depth: number

    blocksVision: boolean
    blocksMovement: boolean;
    material: MaterialType; 
}
export interface Terrain {
    position: Vector3;
    rotation: Vector3;
    width: number,
    height: number,
    depth: number
}

export interface Player {
    isHunter: boolean;
    isFound: boolean;
    isCreator?: boolean;

    name: string;
    id: string
}
export type OtherPlayer = Player & {
    position: Vector3;
    facing: FacingAngles;
}
export type PlayerUpdate = {
    isFound: boolean;
    isHunter: boolean;
}

export type StatusType = "waiting" | "in_progress" | "ended";

export interface Lobby {
    obstacles: Obstacle[];
    terrain: Terrain[];
    roomCode: string;
    status: StatusType;
    spawnPosition: Vector3;
}
export interface LobbyInitialization {
    obstacles: Obstacle[];
    terrain: Terrain[];
    status: StatusType;
}

export type ServerMessage = 
    | { type: "error"; message: string }
    | { type: "initial_state"; lobby: LobbyInitialization; player: Player; position: Vector3; facing: FacingAngles; otherPlayers: OtherPlayer[] }
    | { type: "state_update"; status: StatusType; player: PlayerUpdate; otherPlayers: OtherPlayer[] }
    | { type: "assigned_id"; playerId: string; } 
    | { type: "is_creator"; isCreator: boolean }
    | { type: "game_over"; winner: "hunters" | "hiders" }
    | { type: "capture_result"; success: boolean; targetName: string }
    | { type: "error"; message: string }
    | { type: "kicked"; message: string }
    | { type: "time_update"; remaining: number}


export type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; name: string}
    | { type: "start_game" }
    | { type: "end_game" }
    | { type: "capture_attempt"; targetId: string }
    | { type: "kick_player"; id: string }






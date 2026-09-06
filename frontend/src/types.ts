
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface FacingAngles {
    horizontal: number;
    vertical: number
}

export interface Obstacle {
    position: Vector3
    width: number
    height: number
    depth: number

    blocksVision: boolean
    blocksMovement: boolean
}

export interface Player {
    position: Vector3;
    facing: FacingAngles;
    isHunter: boolean;
    isFound: boolean;

    id: string;
    name: string;
}

export interface Lobby {
    obstacles: Obstacle[];
}

export interface LobbyResponse {
    obstacles: Obstacle[];
    roomCode: string;
    status: "waiting" | "in_progress" | "ended";
}

export type ServerMessage = 
    | { type: "error", message: string }
    | { type: "state_update"; players: Player[] }
    | { type: "player_found"; playerId: string }
    | { type: "assigned_id"; playerId: string } 
    | { type: "game_over"; winner: "seekers" | "hiders" }
    | { type: "capture_result"; targetId: string; success: boolean }


export type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; player: Player}
    | { type: "start_game" }
    | { type: "capture_attempt"; targetId: string }






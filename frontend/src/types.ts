
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

    name: string;
}
export type Players = Record<string, Player>;

export interface Lobby {
    obstacles: Obstacle[];
    roomCode: string;
    status: "waiting" | "in_progress" | "ended";
    spawnPosition: Vector3;
}

export type ServerMessage = 
    | { type: "error", message: string }
    | { type: "state_update"; players: Players; status: string }
    | { type: "assigned_id"; playerId: string } 
    | { type: "game_over"; winner: "hunters" | "hiders" }
    | { type: "capture_result"; success: boolean }


export type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; player: Player}
    | { type: "start_game" }
    | { type: "capture_attempt"; targetId: string }






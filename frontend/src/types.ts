
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

export type StatusType = "waiting" | "in_progress" | "ended";

export interface Lobby {
    obstacles: Obstacle[];
    roomCode: string;
    status: StatusType;
    spawnPosition: Vector3;
}

export type ServerMessage = 
    | { type: "error", message: string }
    | { type: "state_update"; players: Record<string, Player>; status: StatusType }
    | { type: "assigned_id"; playerId: string } 
    | { type: "game_over"; winner: "hunters" | "hiders" }
    | { type: "capture_result"; success: boolean }


export type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; player: Player}
    | { type: "start_game" }
    | { type: "capture_attempt"; targetId: string }






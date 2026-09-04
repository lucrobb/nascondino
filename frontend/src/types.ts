
interface Vector3 {
    x: number;
    y: number;
    z: number;
}
interface FacingAngles {
    horizontal: number;
    vertical: number
}

interface Cell {
    position: Vector3;
    blocksVision: boolean;
    blocksMovement: boolean;
    variant: "wall" | "tree" | "hole" | "empty";
}

interface Obstacle {
    position: Vector3
    width: number
    height: number
    depth: number

    blocksVision: boolean
    blocksMovement: boolean
}

interface Player {
    position: Vector3;
    facing: FacingAngles;
    isHunter: boolean;
    isFound: boolean;

    id: string;
    name: string;
}

interface Lobby {
    obstacles: Obstacle[];
    verticalFov: number;
    horizontalFov: number;
    maxDistance: number;
}

interface LobbyResponse {
    cells: Cell[];
    roomCode: string;
    status: "waiting" | "in progress" | "ended";
}

type ServerMessage = 
    | { type: "error", message: string }
    | { type: "state_update"; players: Player[] }
    | { type: "player_found"; playerId: string }
    | { type: "assigned_id"; playerId: string } 
    | { type: "game_over"; winner: "seekers" | "hiders" }


type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; player: Player}
    | { type: "start_game" }






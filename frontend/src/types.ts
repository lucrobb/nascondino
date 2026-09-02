
interface Vector3 {
    x: number;
    y: number;
    z: number;
}

interface Cell {
    position: Vector3;
    blocksVision: boolean;
    blocksMovement: boolean;
    variant: "wall" | "tree" | "hole" | "empty";
}

interface Player {
    position: Vector3;
    isHunter: boolean;
    isFound: boolean;

    id: string;
    name: string;
}

interface LobbyResponse {
    cells: Cell[];
    roomCode: string;
    status: "waiting" | "in progress" | "ended";
}

type ServerMessage = 
    | { type: "state_update"; players: Player[] }
    | { type: "player_found"; playerId: string }
    | { type: "assigned_id"; playerId: string } 
    | { type: "game_over"; winner: "seekers" | "hiders" }


type ClientMessage = 
    | { type: "move"; position: Vector3; facing: Vector3 }
    | { type: "join"; name: string}
    | { type: "start_game" }






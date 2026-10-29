
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
    forward: number;
    strafe: number;
}
export interface CameraRotation {
    horizontal: number;
    vertical: number;
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

export type StatusType = "waiting" | "inProgress" | "ended";

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
    | { type: "lobbyResult"; roomCode: string }
    | { type: "initialState"; obstacles: Obstacle[]; terrain: Terrain[]; status: StatusType; player: Player; position: Vector3; facing: FacingAngles; otherPlayers: OtherPlayer[] }
    | { type: "stateUpdate"; status: StatusType; player: PlayerUpdate; otherPlayers: OtherPlayer[] }
    | { type: "gameOver"; winner: "hunters" | "hiders" }
    | { type: "captureResult"; success: boolean; targetName: string }
    | { type: "error"; message: string }
    | { type: "kicked"; message: string }
    | { type: "timeUpdate"; remaining: number}


export type ClientMessage = 
    | { type: "move"; position: Vector3; facing: FacingAngles }
    | { type: "join"; name: string}
    | { type: "startGame" }
    | { type: "endGame" }
    | { type: "captureAttempt"; targetId: string }
    | { type: "kickPlayer"; id: string }






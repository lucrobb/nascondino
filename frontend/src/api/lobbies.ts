import type { Lobby, Obstacle, Vector3 } from '../types';
import { apiCall } from './helper';

//I return the bare api calls, because error handling is within the components
export async function createLobby(obstacles: Obstacle[], spawnPosition: Vector3): Promise<Lobby> {
    return apiCall<{ obstacles: Obstacle[], spawnPosition: Vector3 }, Lobby> (
        "lobbies/", "POST", { obstacles, spawnPosition }
    );
}

export async function getLobby(roomCode: string): Promise<Lobby> {
    return apiCall<undefined, Lobby>(
        `lobbies/${roomCode}/`,
        "GET",
        undefined
    );
} 



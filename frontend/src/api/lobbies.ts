import type { Lobby } from '../types';
import { apiCall } from './helper';

//I return the bare api calls, because error handling is within the components

//For testing purposes we don't pass the data necessary for lobby POST, we have a hardcoded map on the backend
export async function createLobby(): Promise<Lobby> {
    return apiCall<undefined, Lobby> (
        "lobbies/", "POST", undefined
    );
}

export async function getLobby(roomCode: string): Promise<Lobby> {
    return apiCall<undefined, Lobby>(
        `lobbies/${roomCode}/`,
        "GET",
        undefined
    );
} 



import type { ServerMessage } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;
type HTTPMethod = "GET" | "POST" | "DELETE" | "PATCH";

async function apiCall<TBody, TResponse>(url: string, method: HTTPMethod, body: TBody): Promise<TResponse> {
    const res = await fetch(`${BASE_URL}/${url}`, {
        method,
        headers: { "Content-Type": "application/json"},
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message: string;
        try {
            const data = await res.json();
            message = data.error ?? `Errore del server: ${res.status}, ${data.error}`;
        } catch {
            message = `Errore del server: ${res.status}`;
        }

        throw new Error(message);
    }

    return res.json();
}

export async function getLobby(roomCode: string): Promise<ServerMessage> {
    return apiCall<undefined, ServerMessage>(`lobby/${roomCode}`, "GET", undefined);
}

export async function createLobby(): Promise<ServerMessage> {
    return apiCall<undefined, ServerMessage>("lobby", "POST", undefined);
}
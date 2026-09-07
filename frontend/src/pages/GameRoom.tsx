import { useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import type { Vector3, Lobby } from '../types';
import { getLobby } from '../api/lobbies';
import { toast } from 'sonner';
import { ApiError } from '../api/helper';

export default function GameRoom() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [position, setPosition] = useState<Vector3 | null>(null);

    async function fetchLobby(code: string): Promise<void> {
        setLoading(true);
        try {
            const data: Lobby = await getLobby(code);
            setLobby(data);
            setPosition(data.spawnPosition);
        } catch (err) {
            console.log("ERROR:", err);
            console.log("INSTANCE:", err instanceof ApiError);
            console.log("MESSAGE:", err instanceof Error ? err.message : err);

            toast.error(err instanceof ApiError ? err.message : "Errore di rete");
            navigate("/");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!roomCode) {
            navigate("/");
            return;
        }

        fetchLobby(roomCode);
        if (lobby) {
            const ws = new WebSocket(`ws://localhost:8000/ws/lobby/${roomCode}`)

            ws.onopen = () => {
                console.log("Websocket connected");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log("Received:", data);
            }

            ws.onerror = (error) => {
                console.error("Websocket error:", error);
            }

            ws.onclose = () => {
                console.log("Websocket disconnected");
            }
        }
    }, [roomCode])

    return (
        <></>
    )
}
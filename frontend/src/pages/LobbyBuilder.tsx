import type { Obstacle, Lobby, Vector3 } from '../types';
import { useState, useEffect } from 'react';
import { createLobby } from '../api/lobbies';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '../api/helper';

export default function LobbyBuilder() {
    const navigate = useNavigate();

    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [spawnPosition, setSpawnPosition] = useState<Vector3 | null>(null)
    const [loading, setLoading] = useState<boolean>(false);

    async function handleBuild(): Promise<void> {
        setLoading(true);
        try {
            const data: Lobby = await createLobby();
            const roomCode = data.roomCode;
            navigate(`/lobby/${roomCode}/`);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Errore di rete");
        } finally {
            setLoading(false);
        }
    }

    //For testing purposes i will automatically create a lobby on initialization
    useEffect(() => {
        handleBuild();
    }, [])

    return (
        <></>
    )
}
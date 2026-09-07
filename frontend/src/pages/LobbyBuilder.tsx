import type { Obstacle, Lobby, Vector3 } from '../types';
import { useState } from 'react';
import { createLobby } from '../api/lobbies';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '../api/helper';

export default function LobbyBuilder() {
    const navigate = useNavigate();

    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [spawnPosition, setSpawnPosition] = useState<Vector3 | null>(null)
    const [loading, setLoading] = useState<boolean>(false);

    async function handleBuild() {
        if (!spawnPosition) {
            toast.error("Scegli una posizione per spawnare!");
            return;
        }
        
        setLoading(true);
        try {
            const data: Lobby = await createLobby(obstacles, spawnPosition);
            const roomCode = data.roomCode;
            navigate(`lobbies/${roomCode}/`);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Errore di rete");
        } finally {
            setLoading(false);
        }
    }

    return (
        <></>
    )
}
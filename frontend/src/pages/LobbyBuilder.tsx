import type { Lobby } from '../types';
import { useEffect } from 'react';
import { createLobby } from '../api/lobbies';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from '../api/helper';
import { LoadingScreen } from '../components/world/LoadingScreen';

export default function LobbyBuilder() {
    const navigate = useNavigate();

    async function handleBuild(): Promise<void> {
        try {
            const data: Lobby = await createLobby();
            const roomCode = data.roomCode;
            navigate(`/lobby/${roomCode}/`);
        } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "Errore di rete");
        }
    }

    //For testing purposes i will automatically create a lobby on initialization
    useEffect(() => {
        handleBuild();
    }, [])

    return (
        <LoadingScreen message="Creazione della lobby in corso" />
    )
}
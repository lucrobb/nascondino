import type { LobbyResponse } from '../types';
import type { Obstacle } from '../types';
import { apiCall, ApiError } from './helper';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CreateLobbyProps {
    obstacles: Obstacle[];
    onLoadingChange: (loading: boolean) => void;
}
export async function createLobby({ obstacles, onLoadingChange }: CreateLobbyProps): Promise<string | null> {
    onLoadingChange(true);
    try{
        const lobby = await apiCall<{ obstacles: Obstacle[] }, LobbyResponse> (
            "lobbies/", "POST", { obstacles }
        );
        return lobby.roomCode;
    } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Qualcosa è andato storto");
        return null;
    } finally {
        onLoadingChange(false);
    }
}

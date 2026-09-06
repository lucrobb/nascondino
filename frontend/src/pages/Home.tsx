import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';



export default function Home() {
    const [roomCode, setRoomCode] = useState<string>('');
    const navigate = useNavigate();

    function handleJoin() {
        const code = roomCode.trim().toUpperCase();
        if (code.length !== 8) {
            toast.error("Il codice non è valido! Riprova.")
            return;
        }
        navigate(`/lobby/${code}`)
    }
    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="flex flex-row items-center gap-2">
                    <Input
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Inserisci codice"
                    />
                    <Button onClick={handleJoin}>
                        Unisciti
                    </Button>
                </div>

                <Button onClick={() => navigate("/build")} variant="outline">
                    Crea Lobby
                </Button>
            </div>
        </div>
    )
}
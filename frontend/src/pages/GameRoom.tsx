import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import type { Vector3, Lobby, ServerMessage, FacingAngles, Player, Players } from '../types';
import { getLobby } from '../api/lobbies';
import { toast } from 'sonner';
import { ApiError } from '../api/helper';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Canvas } from "@react-three/fiber";
import { PlayerController } from '../components/PlayerController';

export default function GameRoom() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [lobby, setLobby] = useState<Lobby | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const position = useRef<Vector3 | null>(null);
    const facing = useRef<FacingAngles | null>(null);
    const [playerReady, setPlayerReady] = useState<boolean>(false);

    const [name, setName] = useState<string | null>(() => sessionStorage.getItem("playerName"));
    const [nameInput, setNameInput] = useState<string>("");

    const [isHunter, setIsHunter] = useState<boolean>(false);
    const [isFound, setIsFound] = useState<boolean>(false);
    const playerId = useRef<string | null>(null);

    const [players, setPlayers] = useState<Players>({});
    const [status, setStatus] = useState<string>("waiting");
    const socketRef = useRef<WebSocket | null>(null); //We use a reference because it doesn't trigger rendering on change

    async function fetchLobby(code: string): Promise<void> {
        setLoading(true);
        try {
            const data: Lobby = await getLobby(code);

            //We only allow to join if lobby is waiting, so isFound and isHunter values are correct
            if (data.status !== "waiting") {
                toast.error("La partita è già iniziata.");
                navigate("/");
                return;
            }

            setLobby(data);
        } catch (err) {
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
    }, [roomCode]);


    function handleNameSubmit() {
        const newName = nameInput.trim();

        if (!newName) return;
        setName(newName);
        sessionStorage.setItem("playerName", newName);
    }


    useEffect(() => {
        if (!roomCode || !name || !playerReady) {
            navigate("/");
            return;
        }
        
        const ws = new WebSocket(`ws://localhost:8000/ws/lobby/${roomCode}/`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("Websocket connected");

            if (!position.current || !facing.current) {
                console.error('Camera data not ready');
                return;
            }

            ws.send(JSON.stringify({
                type: "join",
                player: {
                    position: position.current,
                    facing: facing.current,
                    isHunter,
                    isFound,
                    name
                }
            }))
        };

        ws.onmessage = (event) => {
            const data: ServerMessage = JSON.parse(event.data);

            switch (data.type) {
                case "assigned_id":
                    playerId.current = data.playerId;
                    break;
                
                case "state_update":
                    setStatus(data.status);
                    setPlayers(data.players);
                    break;

                case "capture_result":
                    if (data.success) {
                        toast.success("Catturato!");
                    }
                    break;

                case "game_over":
                    setStatus("ended");
                    toast(data.winner === "hunters" ? "I cacciatori vincono" : "I nascosti vincono!")
                    break;
            }
        }

        ws.onerror = (error) => {
            toast.error("Errore di connessione")
        }

        ws.onclose = () => {
            console.log("Websocket disconnected");
        }

        //close when roomCode changes
        return () => {
            ws.close();
        }
    }, [roomCode, name, playerReady])

    useEffect(() => {
        if (!playerId.current) return;

        const user: Player | null = playerId.current ? players[playerId.current] : null;

        if (!user) return;

        setIsHunter(user.isHunter);
        setIsFound(user.isFound);
    }, [players, playerId])

    return (
        <div className="min-h-screen w-screen">
            <Dialog open={!name}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unisciti alla lobby</DialogTitle>
                        <DialogDescription>
                            Inserisci il nome per unirti alla lobby.
                        </DialogDescription>
                    </DialogHeader>

                    <form //Allows us to use the return button to submit as well
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleNameSubmit();
                        }}
                        className="space-y-4"
                    >
                        <Input
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="Il tuo nome"
                            maxLength={20}
                            autoFocus
                        />

                        <Button
                            type="submit"
                            disabled={!nameInput.trim()}
                            className="w-full"
                        >
                            Unisciti
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div>
                {(!lobby || loading) && (<div>Carica...</div>)}
                {(lobby && !loading) && (
                    <Canvas
                    camera={{
                        position: [
                            lobby.spawnPosition.x,
                            lobby.spawnPosition.y,
                            lobby.spawnPosition.z
                        ],
                        fov: 75,
                        near: 0.1,
                        far: 1000,
                    }}
                >
                    <PlayerController
                        facing={facing}
                        position={position}
                        onReadyChange={setPlayerReady}
                    />
                </Canvas>
                )}
            </div>
        </div>
    );
}
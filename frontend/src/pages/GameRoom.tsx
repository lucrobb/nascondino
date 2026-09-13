import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import type { Vector3, Lobby, ServerMessage, FacingAngles, Player } from '../types';
import { getLobby } from '../api/lobbies';
import { WebsocketSend } from '../api/game';
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
import { PointerLockControls } from "@react-three/drei";
import { Mesh } from "three";

import { PlayerController } from '../components/world/PlayerController';
import { CaptureController } from '../components/world/CaptureController';
import { Lights } from '../components/world/Lights';
import { Ground } from '../components/world/Ground';
import { Obstacles } from '../components/world/Obstacles';
import { Players } from '../components/world/Players';


export default function GameRoom() {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [lobby, setLobby] = useState<Lobby | null>(null);

    const isWaiting = lobby?.status === "waiting";
    const isPlaying = lobby?.status === "in_progress";
    const isEnded = lobby?.status === "ended";
    const [winner, setWinner] = useState<"hunters" | "hiders" | null>(null);

    const position = useRef<Vector3 | null>(null);
    const facing = useRef<FacingAngles | null>(null);

    const terrainRef = useRef<Mesh[]>([]);
    function registerTerrain(mesh: Mesh | null): void {
        if (mesh && !terrainRef.current.includes(mesh)) {
            terrainRef.current.push(mesh);
        }
    }

    const [playerReady, setPlayerReady] = useState<boolean>(false);

    const [name, setName] = useState<string | null>(() => sessionStorage.getItem("playerName"));
    const [nameInput, setNameInput] = useState<string>("");

    const [isHunter, setIsHunter] = useState<boolean>(false);
    const [isFound, setIsFound] = useState<boolean>(false);
    const [isCreator, setIsCreator] = useState<boolean>(false);
    const playerId = useRef<string | null>(null);

    const [players, setPlayers] = useState<Record<string, Player>>({});

    const socketRef = useRef<WebSocket | null>(null); 
    //Class storing all websocket client messages to send to the server
    const wsSend = new WebsocketSend(socketRef);

    async function fetchLobby(code: string): Promise<void> {
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


    //Websocket connection established once user chooses name and enters in lobby (full Player data)
    useEffect(() => {
        if (!roomCode || !name || !playerReady) {
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

            wsSend.join(
                position.current,
                facing.current,
                isHunter,
                isFound,
                name
            )
        };

        ws.onmessage = (event) => {
            const data: ServerMessage = JSON.parse(event.data);

            switch (data.type) {
                case "assigned_id":
                    playerId.current = data.playerId;
                    break;
                
                case "is_creator":
                    setIsCreator(data.isCreator);
                    break;

                case "state_update":
                    setLobby(lobby => {
                        if (!lobby) return lobby;

                        return {
                            ...lobby,
                            status: data.status
                        } 
                    });
                    setPlayers(data.players);
                    break;

                case "capture_result":
                    if (data.success) {
                        toast.success("Catturato!");
                    }
                    break;

                case "game_over":
                    setLobby(lobby => {
                        if (!lobby) return lobby;

                        return {
                            ...lobby,
                            status: "ended"
                        }
                    });
                    setWinner(data["winner"])
                    break;

                case "error":
                    toast.error(data.message);
                    break;
            }
        }

        ws.onerror = () => {
            toast.error("Errore di connessione")
        }

        ws.onclose = () => {
            console.log("Websocket disconnected");
            sessionStorage.removeItem("playerId");
        }

        //close when roomCode changes
        return () => {
            ws.close();
        }
    }, [roomCode, name, playerReady])

    //Updates player's state based on the new player data incoming from Websocket
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
                    <DialogHeader className="uppercase tracking-wide">
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

            <div className="w-full h-screen relative">
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                </div>

                {!lobby && (<div>Carica...</div>)}
                {isWaiting && isCreator && (
                    <div className="fixed top-10 right-10 z-20">
                        <Button onClick={wsSend.startGame}>
                            Inizia partita
                        </Button>
                    </div>
                )}
                {isWaiting && (
                    <>
                        <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                            <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                                {isCreator ? "In attesa che inizi la partita" : "In attesa che l'host inizi la partita"}
                            </div>
                        </div>

                        <div className="fixed top-6 left-6 z-20 flex flex-col gap-1 bg-background/80 p-3 rounded-md">
                            {Object.entries(players).map(([id, p]) => (
                                <div key={id} className="flex items-center gap-2 text-sm">
                                    <span>{p.name}</span>
                                    {isCreator && id !== playerId.current && isWaiting && (
                                        <button onClick={() => wsSend.kickPlayer(id)} className="text-destructive text-xs">✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {isPlaying && !isFound && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        <div className={`px-6 py-2 rounded-md uppercase tracking-wide font-medium ${
                            isHunter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                        }`}>
                            {isHunter ? "Cacciatore" : "Nascost*"}
                        </div>
                    </div>
                )}
                {isEnded && (
                    <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                        <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                            La partita è finita. Hanno vinto i {winner === "hunters" ? "cacciatori" : "nascosti"}
                        </div>
                    </div>
                )}
                {isFound && (
                    <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                        <div className="bg-destructive text-destructive-foreground px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                            Sei stat* trovat*
                        </div>
                    </div>
                )}


                {(lobby) && (
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
                    <PointerLockControls />
                    <PlayerController
                        facing={facing}
                        position={position}
                        obstacles={lobby.obstacles}
                        groundRef={terrainRef}
                        onReadyChange={setPlayerReady}
                        onMove={wsSend.move}
                        isFound={isFound}
                    />
                    <CaptureController
                        onCapture={wsSend.captureTarget}
                    />
                    <Lights />
                    <Ground onRegisterRef={registerTerrain} terrain={lobby.terrain}/>
                    <Obstacles obstacles={lobby.obstacles} />
                    <Players players={players} pId={playerId.current}/>
                </Canvas>
                )}
            </div>
        </div>
    );
}
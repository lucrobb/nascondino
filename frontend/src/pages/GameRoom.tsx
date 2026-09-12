import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import type { Vector3, Lobby, ServerMessage, FacingAngles, Player } from '../types';
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
    const [loading, setLoading] = useState<boolean>(false);

    const position = useRef<Vector3 | null>(null);
    const facing = useRef<FacingAngles | null>(null);

    const terrainRef = useRef<Mesh[]>([]);

    const [playerReady, setPlayerReady] = useState<boolean>(false);

    const [name, setName] = useState<string | null>(() => sessionStorage.getItem("playerName"));
    const [nameInput, setNameInput] = useState<string>("");

    const [isHunter, setIsHunter] = useState<boolean>(false);
    const [isFound, setIsFound] = useState<boolean>(false);
    const [isCreator, setIsCreator] = useState<boolean>(false);
    const playerId = useRef<string | null>(null);

    const [players, setPlayers] = useState<Record<string, Player>>({});
    const socketRef = useRef<WebSocket | null>(null); //We use a reference because it doesn't trigger rendering on change

    function registerTerrain(mesh: Mesh | null): void {
        if (mesh && !terrainRef.current.includes(mesh)) {
            terrainRef.current.push(mesh);
        }
    }

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

    function move(pos: Vector3, fac: FacingAngles): void {
        if (!socketRef.current) return;
        socketRef.current.send(JSON.stringify({
            type: "move", position: pos, facing: fac
        }))
    }


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
                    toast(data.winner === "hunters" ? "I cacciatori vincono" : "I nascosti vincono!")
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

    useEffect(() => {
        if (!playerId.current) return;

        const user: Player | null = playerId.current ? players[playerId.current] : null;

        if (!user) return;

        setIsHunter(user.isHunter);
        setIsFound(user.isFound);
    }, [players, playerId])

    function captureTarget(targetId: string): void {
        if (socketRef.current && lobby && lobby.status === "in_progress") {
            socketRef.current.send(JSON.stringify({
                type: "capture_attempt",
                targetId
            }))
        }
    }
    function startGame() {
        if (socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: "start_game"
            }))
        }
    }

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
                {(!lobby || loading) && (<div>Carica...</div>)}
                {(lobby && !loading && lobby.status === "waiting" && isCreator) && (
                    <div className="fixed top-10 right-10 z-20">
                        <Button onClick={startGame}>
                            Inizia partita
                        </Button>
                    </div>
                )}
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
                    <PointerLockControls />
                    <PlayerController
                        facing={facing}
                        position={position}
                        obstacles={lobby.obstacles}
                        groundRef={terrainRef}
                        onReadyChange={setPlayerReady}
                        onMove={move}
                    />
                    <CaptureController
                        onCapture={captureTarget}
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
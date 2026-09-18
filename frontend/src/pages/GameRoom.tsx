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
import {
    Tabs,
    TabsList,
    TabsContent,
    TabsTrigger
} from "../components/ui/tabs";
import{
    Table,
    TableCaption,
    TableHeader,
    TableRow,
    TableHead,
    TableCell,
    TableBody
} from "../components/ui/table";
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
import { Kbd } from '@/components/ui/kbd';


export default function GameRoom() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const WS_URL = import.meta.env.VITE_WS_URL;

    const [lobby, setLobby] = useState<Lobby | null>(null);

    const isWaiting = lobby?.status === "waiting";
    const isPlaying = lobby?.status === "in_progress";
    const isEnded = lobby?.status === "ended";
    const [winner, setWinner] = useState<"hunters" | "hiders" | null>(null);

    const position = useRef<Vector3 | null>(null);
    const facing = useRef<FacingAngles | null>(null);
    const PLAYER_HEIGHT = 1;

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
    let playerId: string | null = localStorage.getItem("playerId");
    if (!playerId) {
        playerId = crypto.randomUUID();
        localStorage.setItem("playerId", playerId)
    }

    const [players, setPlayers] = useState<Record<string, Player>>({});
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const socketRef = useRef<WebSocket | null>(null); 
    //Class storing all websocket client messages to send to the server
    const wsSend = new WebsocketSend(socketRef);

    async function fetchLobby(code: string): Promise<void> {
        try {
            const data: Lobby = await getLobby(code);

            //We only allow to join if lobby is waiting, so isFound and isHunter values are correct
            if (data.status === "in_progress") {
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

        const ws = new WebSocket(`${WS_URL}/${roomCode}/${playerId}/`);
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

                case "time_update":
                    setTimeRemaining(data["remaining"]);
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

                case "kicked":
                    toast.error(data.message);
                    navigate("/");
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
        if (!playerId) return;

        const user: Player | null = players[playerId];

        if (!user) return;

        setIsHunter(user.isHunter);
        setIsFound(user.isFound);
    }, [players, playerId])

    //Handles menu state based on pointer lock
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent): void {
            if ((!document.pointerLockElement && e.code === "Escape") || e.code === "Tab") {
                document.exitPointerLock();
                setMenuOpen(true); // pointer lock was exited (Esc, or programmatically) — show menu
            } else if (e.code === "Enter" && isCreator && !isPlaying) {
                wsSend.startGame();
            } else if (e.code === "Backspace" && isEnded) {
                navigate("/");
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isCreator, isPlaying, isEnded]);
    


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
            {name && (
                <div className="w-full h-screen relative">
                    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-10">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>

                    {!lobby && (<div>Carica...</div>)}
                    {menuOpen && (
                        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                            <DialogContent
                                className="pointer-events-auto"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Tabs defaultValue="menu">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="menu" className="uppercase tracking-wide">Menu</TabsTrigger>
                                        {isCreator && <TabsTrigger value="players" className="uppercase tracking-wide">Giocatori</TabsTrigger>}
                                    </TabsList>
                                    <TabsContent value="menu">
                                        <div className="flex flex-col gap-4">
                                            <Button onClick={() => setMenuOpen(false)}>Riprendi</Button>

                                            {isCreator && (
                                                <div className="border-t pt-4 flex flex-col gap-2">
                                                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                                                        Controlli host
                                                    </span>

                                                    {!isPlaying && (
                                                        <Button onClick={() => {
                                                            wsSend.startGame();
                                                            setMenuOpen(false);
                                                        }}>
                                                            Inizia partita
                                                        </Button>
                                                    )}
                                                    {isPlaying && (
                                                        <Button variant="destructive" onClick={wsSend.endGame}>
                                                            Termina partita
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <Button variant="destructive" onClick={() => navigate("/")}>Esci dalla partita</Button>
                                        </div>
                                    </TabsContent>
                                    {isCreator && (
                                        <TabsContent value="players">
                                            <Table>
                                                <TableCaption>{Object.entries(players).length > 1 ? "Giocatori nella lobby" : "La lobby è vuota"}</TableCaption>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="uppercase tracking-wide">Nome</TableHead>
                                                        <TableHead className="uppercase tracking-wide">Cacciatore</TableHead>
                                                        <TableHead className="uppercase tracking-wide">Trovat*</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Object.entries(players).map(([id, p]) => id !== playerId && (
                                                        <TableRow key={id}>
                                                            <TableCell>{p.name}</TableCell>
                                                            <TableCell>{p.isHunter ? "SÌ" : "NO"}</TableCell>
                                                            <TableCell>{p.isFound ? "SÌ" : "NO"}</TableCell>
                                                            <TableCell align="right">
                                                                <Button variant="destructive" className="text-xs h-fit p-2" onClick={() => wsSend.kickPlayer(id)}>Espelli</Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TabsContent>
                                    )}
                                </Tabs>
                                
                            </DialogContent>
                        </Dialog>
                    )}

                    <div className="fixed top-10 right-10 z-20 flex flex-col gap-2">
                        {isCreator && !isPlaying && (
                            <Button onClick={wsSend.startGame}>
                                Inizia partita
                                <Kbd className="ml-2 bg-transparent text-current">⏎</Kbd>
                            </Button>
                        )}
                        {isEnded && (
                            <Button onClick={() => navigate("/")}>
                                Esci
                                <Kbd className="ml-2 bg-transparent text-current">⌫</Kbd>
                            </Button>
                        )}
                    </div>
                    {isWaiting && (
                        <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                            <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                                {isCreator ? "In attesa che inizi la partita" : "In attesa che l'host inizi la partita"}
                            </div>
                        </div>
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
                    {isPlaying && timeRemaining !== null && (
                        <div className="fixed top-6 right-6 z-20 text-2xl font-mono">
                            {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
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
                            playerHeight={PLAYER_HEIGHT}
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
                        <Players players={players} pId={playerId} playerHeight={PLAYER_HEIGHT}/>
                    </Canvas>
                    )}
                </div>
            )}
        </div>
    );
}
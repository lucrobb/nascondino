import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import type { 
    Vector3, 
    Lobby, 
    ServerMessage, 
    FacingAngles, 
    Player, 
    OtherPlayer,
    StatusType, 
    Obstacle,
    Terrain 
} from '../types';
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

    const playerId = useRef<string>(localStorage.getItem("playerId") ?? crypto.randomUUID());
    useEffect(() => {
        localStorage.setItem("playerId", playerId.current);
        console.log("Player id:", playerId.current);
    }, []);

    const name = useRef<string | null>(sessionStorage.getItem("playerName"));
    const nameInput = useRef<string>("")
    const [initialized, setInitialized] = useState<boolean>(false);

    const [status, setStatus] = useState<StatusType | null>(null);
    const [winner, setWinner] = useState<"hunters" | "hiders" | null>(null);

    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [terrain, setTerrain] = useState<Terrain[]>([]);
    const terrainRef = useRef<Mesh[]>([]);
    function registerTerrain(mesh: Mesh | null): void {
        if (mesh && !terrainRef.current.includes(mesh)) {
            terrainRef.current.push(mesh);
        }
    }

    const [player, setPlayer] = useState<Player | null>(null);
    const position = useRef<Vector3 | null>(null);
    const facing = useRef<FacingAngles | null>(null);
    const [otherPlayers, setOtherPlayers] = useState<OtherPlayer[]>([]);

    const PLAYER_HEIGHT = 1;

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const socketRef = useRef<WebSocket | null>(null);
    //Class storing all websocket client messages to send to the server
    const wsSend = new WebsocketSend(socketRef);



    useEffect(() => {
        if (!roomCode) {
            navigate("/");
            return;
        }

        socketRef.current = new WebSocket(`${WS_URL}/${roomCode}/${playerId.current}`)
    }, [roomCode]);


    function handleNameSubmit() {
        const newName = nameInput.current.trim();

        if (!newName) return;
        name.current = newName
        sessionStorage.setItem("playerName", newName);
    }

    useEffect(() => {
        if (!name.current || !socketRef.current) return;

        //We send the join request to the server to load the lobby
        socketRef.current.onopen = () => {
            wsSend.join(name.current);
        }

        socketRef.current.onmessage = (event) => {
            const data: ServerMessage = JSON.parse(event.data);

            if (data.type === "initial_state") {
                setObstacles(data.lobby.obstacles);
                setTerrain(data.lobby.terrain);
                setStatus(data.lobby.status);

                setPlayer(data.player);
                position.current = data.position;
                facing.current = data.facing;
                setOtherPlayers(data.otherPlayers);

                setInitialized(true);
            }
            //Player not yet loaded, can't send any other messages until then 
            else if (!player) return;

            else if (data.type === "state_update") {
                setStatus(data.status);

                setPlayer(prev => prev ? {...prev, isFound: data.player.isFound, isHunter: data.player.isHunter} : prev)
                setOtherPlayers(data.otherPlayers);
            }

            else if (data.type === "time_update") {
                setTimeRemaining(data.remaining);
            }

            else if (data.type === "capture_result") {
                if (data.success) toast.success(`Hai catturato ${data.targetName}!`);
                else toast.error(`Ti è sfuggit* ${data.targetName}!`)
            }

            else if (data.type === "game_over") {
                setStatus("ended");
                setWinner(data.winner);
            }

            else if (data.type === "kicked") {
                toast.error(data.message);
                navigate("/");
            }

            else if (data.type === "error") toast.error(data.message);

        }

        socketRef.current.onerror = () => {
            toast.error("Errore di connessione")
        }

        //close when roomCode changes
        return () => {
            if (!socketRef.current) return;
            socketRef.current.close();
        }

    }, [initialized])

    //Handles menu state based on pointer lock
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent): void {
            if ((!document.pointerLockElement && e.code === "Escape") || e.code === "Tab") {
                document.exitPointerLock();
                setMenuOpen(true); // pointer lock was exited (Esc, or programmatically) — show menu
            } else if (e.code === "Enter" && player?.isCreator && status !== "in_progress") {
                wsSend.startGame();
            } else if (e.code === "Backspace" && status === "ended") {
                navigate("/");
            }
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [player, status]);
    


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
                            onChange={(e) => nameInput.current = e.target.value}
                            placeholder="Il tuo nome"
                            maxLength={20}
                            autoFocus
                        />

                        <Button
                            type="submit"
                            disabled={!nameInput.current.trim()}
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

                    {!initialized && (<div>Carica...</div>)}
                    {menuOpen && player && initialized && (
                        <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
                            <DialogContent
                                className="pointer-events-auto"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Tabs defaultValue="menu">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="menu" className="uppercase tracking-wide">Menu</TabsTrigger>
                                        {player.isCreator && <TabsTrigger value="players" className="uppercase tracking-wide">Giocatori</TabsTrigger>}
                                    </TabsList>
                                    <TabsContent value="menu">
                                        <div className="flex flex-col gap-4">
                                            <Button onClick={() => setMenuOpen(false)}>Riprendi</Button>

                                            {player.isCreator && (
                                                <div className="border-t pt-4 flex flex-col gap-2">
                                                    <span className="text-sm uppercase tracking-wide text-muted-foreground">
                                                        Controlli host
                                                    </span>

                                                    {status !== "in_progress" && (
                                                        <Button onClick={() => {
                                                            wsSend.startGame();
                                                            setMenuOpen(false);
                                                        }}>
                                                            Inizia partita
                                                        </Button>
                                                    )}
                                                    {status === "in_progress" && (
                                                        <Button variant="destructive" onClick={wsSend.endGame}>
                                                            Termina partita
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <Button variant="destructive" onClick={() => navigate("/")}>Esci dalla partita</Button>
                                        </div>
                                    </TabsContent>
                                    {player.isCreator && (
                                        <TabsContent value="players">
                                            <Table>
                                                <TableCaption>{otherPlayers.length > 1 ? "Giocatori nella lobby" : "La lobby è vuota"}</TableCaption>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="uppercase tracking-wide">Nome</TableHead>
                                                        <TableHead className="uppercase tracking-wide">Cacciatore</TableHead>
                                                        <TableHead className="uppercase tracking-wide">Trovat*</TableHead>
                                                        <TableHead></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {otherPlayers.map((p) => p.id !== playerId.current && (
                                                        <TableRow key={p.id}>
                                                            <TableCell>{p.name}</TableCell>
                                                            <TableCell>{p.isHunter ? "SÌ" : "NO"}</TableCell>
                                                            <TableCell>{p.isFound ? "SÌ" : "NO"}</TableCell>
                                                            <TableCell align="right">
                                                                <Button variant="destructive" className="text-xs h-fit p-2" onClick={() => wsSend.kickPlayer(p.id)}>Espelli</Button>
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
                        {player?.isCreator && status !== "in_progress" && (
                            <Button onClick={wsSend.startGame}>
                                Inizia partita
                                <Kbd className="ml-2 bg-transparent text-current">⏎</Kbd>
                            </Button>
                        )}
                        {status === "ended" && (
                            <Button onClick={() => navigate("/")}>
                                Esci
                                <Kbd className="ml-2 bg-transparent text-current">⌫</Kbd>
                            </Button>
                        )}
                    </div>
                    {status === "waiting" && (
                        <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                            <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                                {player?.isCreator ? "In attesa che inizi la partita" : "In attesa che l'host inizi la partita"}
                            </div>
                        </div>
                    )}
                    {status === "in_progress" && !player?.isFound && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                            <div className={`px-6 py-2 rounded-md uppercase tracking-wide font-medium ${
                                player?.isHunter ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                            }`}>
                                {player?.isHunter ? "Cacciatore" : "Nascost*"}
                            </div>
                        </div>
                    )}
                    {status === "in_progress" && timeRemaining !== null && (
                        <div className="fixed top-6 right-6 z-20 text-2xl font-mono">
                            {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
                        </div>
                    )}
                    {status === "ended" && (
                        <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                            <div className="bg-background border-2 px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                                La partita è finita. Hanno vinto i {winner === "hunters" ? "cacciatori" : "nascosti"}
                            </div>
                        </div>
                    )}
                    {player?.isFound && (
                        <div className="fixed top-0 inset-x-0 flex justify-center pt-6 z-20 pointer-events-none">
                            <div className="bg-destructive text-destructive-foreground px-6 py-2 rounded-md uppercase tracking-wide font-medium">
                                Sei stat* trovat*
                            </div>
                        </div>
                    )}


                    {initialized && player && position.current && facing.current && (
                        <Canvas
                        camera={{
                            position: [
                                position.current.x,
                                position.current.y,
                                position.current.z
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
                            obstacles={obstacles}
                            groundRef={terrainRef}
                            onMove={wsSend.move}
                            isFound={player.isFound}
                        />
                        <CaptureController
                            onCapture={wsSend.captureTarget}
                        />
                        <Lights />
                        <Ground onRegisterRef={registerTerrain} terrain={terrain}/>
                        <Obstacles obstacles={obstacles} />
                        <Players players={otherPlayers} pId={playerId.current} playerHeight={PLAYER_HEIGHT}/>
                    </Canvas>
                    )}
                </div>
            )}
        </div>
    );
}
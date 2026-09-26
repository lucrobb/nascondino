import { useParams, useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import type { 
    Vector3, 
    ServerMessage, 
    FacingAngles, 
    Player, 
    OtherPlayer,
    StatusType, 
    Obstacle,
    Terrain,
    Movement,
} from '../types';
import { WebsocketSend } from '../api/game';
import { toast } from 'sonner';
import { Canvas } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import type { Camera } from "three";
import { Mesh } from "three";

import { PlayerController } from '../components/world/PlayerController';
import { CaptureController } from '../components/world/CaptureController';
import { Lights } from '../components/world/Lights';
import { Ground } from '../components/world/Ground';
import { Obstacles } from '../components/world/Obstacles';
import { Players } from '../components/world/Players';

import { GameUi } from '../components/world/GameUi';
import { NameInput } from '../components/world/NameInput';
import { MenuDialog } from '../components/world/MenuDialog';
import { SceneFog } from '../components/world/SceneFog';
import { LoadingScreen } from '@/components/world/LoadingScreen';
import { Joystick } from '../components/world/Joystick';
import { CameraTouch } from '../components/world/CameraTouch'; 


export default function GameRoom() {
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const WS_URL = import.meta.env.VITE_WS_URL;

    const playerId = useRef<string>(localStorage.getItem("playerId") ?? crypto.randomUUID());
    useEffect(() => {
        localStorage.setItem("playerId", playerId.current);
        console.log("Player id:", playerId.current);
    }, []);

    const [name, setName] = useState<string | null>(sessionStorage.getItem("playerName"));
    const [nameInput, setNameInput] = useState<string>("")
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

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    //Class storing all websocket client messages to send to the server
    const wsSend = new WebsocketSend(socketRef);


    function handleNameSubmit() {
        const newName = nameInput.trim();

        if (!newName) return;
        setName(newName);
        sessionStorage.setItem("playerName", newName);
    }

    useEffect(() => {
        if (!name || !roomCode) return;

        const socket = new WebSocket(`${WS_URL}/${roomCode}/${playerId.current}/`);
        socketRef.current = socket;

        //We send the join request to the server to load the lobby
        socket.onopen = () => {
            wsSend.join(name);
        }

        socket.onmessage = (event) => {
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

            else if (data.type === "state_update") {
                setStatus(data.status);

                setPlayer(prev => prev ? {...prev, isFound: data.player.isFound, isHunter: data.player.isHunter} : prev)
                setOtherPlayers(data.otherPlayers);
            }

            else if (data.type === "time_update") {
                setTimeRemaining(data.remaining);
            }

            else if (data.type === "capture_result") {
                if (data.success) {
                    setCaptureFeedback(`Hai catturato ${data.targetName}`);
                    setTimeout(() => {
                        setCaptureFeedback(null);
                    }, 1100);
                } else {
                    setCaptureFeedback(`Ti è sfuggit* ${data.targetName}`);
                    setTimeout(() => {
                        setCaptureFeedback(null);
                    }, 1100);
                }
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

        socket.onerror = (event) => {
            console.log("Websocket error:", event);
        }


        return () => {
            socket.close();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        }

    }, [name, roomCode])

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
    


    const PLAYER_HEIGHT = 1;
    const MAX_DISTANCE = 15;
    const WORLD_SKY = "#aaa79f";
    const WORLD_FOG = "#8f8d87";
    const WORLD_SIZE = 100;

    const moveState = useRef<Movement>({
        forward: 0,
        strafe: 0
    });
    const [camera, setCamera] = useState<Camera | null>(null)

    const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
    useEffect(() => {
        const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setShowTouchControls(hasTouch);
    }, []);


    return (
        <div className="h-screen w-screen relative">
            <NameInput
                name={name}
                nameInput={nameInput}
                onNameInputChange={setNameInput}
                onHandleNameSubmit={handleNameSubmit}
            />
            {name && (
                <>
                    {!initialized && <LoadingScreen message="Caricamento della partita" />}

                    {initialized && player && status && (
                        <>
                            <MenuDialog
                                isCreator={player.isCreator!}
                                playerId={playerId}
                                menuOpen={menuOpen}
                                onMenuOpenChange={setMenuOpen}
                                status={status}
                                onWsSend={wsSend}
                                onNavigate={navigate}
                                otherPlayers={otherPlayers}
                            />  
                            <GameUi
                                status={status}
                                timeRemaining={timeRemaining}
                                winner={winner}
                                player={player}
                                onNavigate={navigate}
                                onWsSend={wsSend}
                                captureFeedback={captureFeedback}
                            />
                            {showTouchControls && camera && (
                                <>
                                    <Joystick moveState={moveState} />
                                    <CameraTouch camera={camera}/>
                                </>
                            )}

                            <Canvas
                                onCreated={({ camera }) => {
                                    setCamera(camera);
                                }}
                                shadows
                                camera={{
                                    position: [
                                        position.current!.x,
                                        position.current!.y,
                                        position.current!.z
                                    ],
                                    fov: 75,
                                    near: 0.1,
                                    far: 1000,
                                }}
                            >
                                <color attach="background" args={[WORLD_SKY]} />
                                {!showTouchControls && <PointerLockControls />}
                                <PlayerController
                                    facing={facing}
                                    position={position}
                                    playerHeight={PLAYER_HEIGHT}
                                    obstacles={obstacles}
                                    groundRef={terrainRef}
                                    onMove={wsSend.move}
                                    moveState={moveState}
                                    isFound={player.isFound}
                                />
                                <CaptureController
                                    onCapture={wsSend.captureTarget}
                                />
                                <Lights />
                                <SceneFog maxDistance={MAX_DISTANCE} fogColor={WORLD_FOG}/>
                                <Ground onRegisterRef={registerTerrain} terrain={terrain} worldSize={WORLD_SIZE}/>
                                <Obstacles obstacles={obstacles} />
                                <Players players={otherPlayers} playerHeight={PLAYER_HEIGHT}/>
                            </Canvas>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
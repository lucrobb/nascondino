import type { Player } from '../../types';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useRef } from 'react';


interface PlayerProps {
    player: Player;
    playerId: string;
    playerHeight: number;
}

function Player({ player, playerId, playerHeight }: PlayerProps) {
    //playerRef modifies the group mesh directly with its current state
    const playerRef = useRef<Group>(null);
    const currentPosition = useRef<Vector3>(new Vector3());
    const targetPosition = useRef<Vector3>(new Vector3());

    const initialized = useRef<boolean>(false);

    useFrame((_, delta) => {
        if (!playerRef.current) return;

        targetPosition.current.set(
            player.position.x,
            player.position.y,
            player.position.z
        );

        if (!initialized.current) {
            //Jumps straight to target
            currentPosition.current.copy(targetPosition.current);
            playerRef.current.position.copy(currentPosition.current);

            initialized.current = true;
            return;
        }

        currentPosition.current.lerp(targetPosition.current, delta * 10);
        playerRef.current.position.copy(currentPosition.current);
    })

    const color = player.isHunter ? "#e04300" : "#ccff99"

    return (
        //The y of player positions is the top pf the avatar, we need to subtract the player height
        <group ref={playerRef}>
            <mesh position={[0, -playerHeight + 0.875, 0]} userData={{ playerId: playerId }}>
                <sphereGeometry args={[0.25]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -playerHeight + 0.25, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    )

}


interface PlayersProps {
    players: Record<string, Player>
    pId: string | null;
    playerHeight: number;
}

//pId stores the user's own player, so they can't see themself
export function Players({ players, pId, playerHeight }: PlayersProps) {
    return (
        <>
            {Object.entries(players).map(([id, p]) => (
                id !== pId && !p.isFound && (
                    <Player key={id} player={p} playerId={id} playerHeight={playerHeight}/>
                )
            ))}
        </>
    )
}
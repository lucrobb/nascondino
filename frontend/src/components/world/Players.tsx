import type { Player } from '../../types';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useRef } from 'react';


interface PlayerProps {
    player: Player;
}

function Player({ player }: PlayerProps) {
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
        <group ref={playerRef}>
            <mesh position={[0, 2, 0]}>
                <sphereGeometry args={[0.5]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
    )

}


interface PlayersProps {
    players: Record<string, Player>
}

export function Players({ players }: PlayersProps) {
    return (
        <>
            {Object.entries(players).map(([id, p]) => (
                <Player key={id} player={p} />
            ))}
        </>
    )
}
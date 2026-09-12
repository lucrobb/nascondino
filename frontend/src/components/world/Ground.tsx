import { Mesh } from "three";
import type { Terrain } from "../../types";
import { TerrainPiece } from './TerrainPiece';

interface GroundProps {
    onRegisterRef: (mesh: Mesh | null) => void;
    terrain: Terrain[];
}

export function Ground({ onRegisterRef, terrain }: GroundProps) {
    return (
        <mesh ref={onRegisterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#e5e2e2" />
        </mesh>
        {terrain.map((t, i) => (
            <TerrainPiece terrain={t} onRegisterRef={onRegisterRef} />
        ))}
    );
}
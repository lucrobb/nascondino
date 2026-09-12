import { Mesh } from "three";
import type { Terrain } from "../../types";

interface TerrainPieceProps {
    terrain: Terrain;
    onRegisterRef: (mesh: Mesh | null) => void;
}

export function TerrainPiece({ terrain, onRegisterRef }: TerrainPieceProps) {
    return (
        <mesh
            ref={onRegisterRef}
            position={[terrain.position.x, terrain.position.y, terrain.position.z]}
            rotation={[terrain.rotation.x, terrain.rotation.y, terrain.rotation.z]}
            receiveShadow
        >
            <boxGeometry args={[terrain.width, terrain.height, terrain.depth]} />
            <meshStandardMaterial color="#555" />
        </mesh>
    );
}
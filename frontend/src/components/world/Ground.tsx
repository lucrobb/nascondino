import { Mesh } from "three";
import type { Terrain } from "../../types";


interface TerrainPieceProps {
    terrain: Terrain;
    onRegisterRef: (mesh: Mesh | null) => void;
}

function TerrainPiece({ terrain, onRegisterRef }: TerrainPieceProps) {
    return (
        <mesh
            ref={onRegisterRef}
            position={[terrain.position.x, terrain.position.y, terrain.position.z]}
            rotation={[terrain.rotation.x, terrain.rotation.y, terrain.rotation.z]}
            receiveShadow
        >
            <boxGeometry args={[terrain.width, terrain.height, terrain.depth]} />
            <meshStandardMaterial
                color="#777773"
                roughness={0.9}
                metalness={0}
            />
        </mesh>
    );
}


interface GroundProps {
    onRegisterRef: (mesh: Mesh | null) => void;
    terrain: Terrain[];
    worldSize: number;
}

export function Ground({ onRegisterRef, terrain, worldSize }: GroundProps) {
    return (
        <>
            <mesh ref={onRegisterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[worldSize, worldSize]} />
                <meshStandardMaterial
                    color="#777773"
                    roughness={0.9}
                    metalness={0}
                />
            </mesh>
            
            {terrain.map((t, i) => (
                <TerrainPiece key={i} terrain={t} onRegisterRef={onRegisterRef} />
            ))}
        </>
    );
}
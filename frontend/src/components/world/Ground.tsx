import { Mesh } from "three";

interface GroundProps {
    ref: React.RefObject<Mesh | null>;
}

export function Ground({ ref }: GroundProps) {
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="#e5e2e2" />
        </mesh>
    );
}
import type { Obstacle } from '../../types';

interface ObstaclesProps {
    obstacles: Obstacle[]
}

export function Obstacles({ obstacles }: ObstaclesProps) {
    return (
        <>
            {obstacles.map((ob, i) => (
                <mesh
                    key={i}
                    position={[ob.position.x, ob.position.y, ob.position.z]}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[ob.width, ob.height, ob.depth]} />
                    <meshStandardMaterial color={ob.blocksVision ? "#8b4513" : "#556b2f"} />
                </mesh>
            ))}
        </>
    )
}
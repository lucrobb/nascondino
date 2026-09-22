import type { Obstacle, MaterialType } from '../../types';


interface Material {
    color: string;
    roughness: number;
    metalness: number;
    maps?: {
        color?: string;
        normal?: string;
        roughness?: string;
        ao?:string,
        displacement?: string;
    };
}

const MATERIALS: Record<MaterialType, Material> = {
    concrete: {
        color: "#777773",
        roughness: 0.92,
        metalness: 0,
    },

    brick: {
        color: "#81483d",
        roughness: 0.9,
        metalness: 0,
    },

    stone: {
        color: "#6f6e68",
        roughness: 0.96,
        metalness: 0,
    },

    wood: {
        color: "#6d513b",
        roughness: 0.86,
        metalness: 0,
    },

    metal: {
        color: "#4f5355",
        roughness: 0.35,
        metalness: 0.8,
    },

    rustedMetal: {
        color: "#714338",
        roughness: 0.88,
        metalness: 0.45,
    },

    glass: {
        color: "#aebfc0",
        roughness: 0.12,
        metalness: 0,
    },

    grass: {
        color: "#59644b",
        roughness: 1,
        metalness: 0,
    },

    dirt: {
        color: "#685442",
        roughness: 1,
        metalness: 0,
    },

    sand: {
        color: "#a99a78",
        roughness: 1,
        metalness: 0,
    },

    gravel: {
        color: "#686761",
        roughness: 1,
        metalness: 0,
    },

    asphalt: {
        color: "#303131",
        roughness: 0.94,
        metalness: 0,
    },
};

interface ObstacleProps {
    obstacle: Obstacle;
}

export function Obstacle({ obstacle }: ObstacleProps) {
    const material: Material = MATERIALS[obstacle.material] ?? MATERIALS["concrete"];

    return (
        <mesh
            position={[obstacle.position.x, obstacle.position.y, obstacle.position.z]}
            castShadow
            receiveShadow
        >
            <boxGeometry args={[obstacle.width, obstacle.height, obstacle.depth]} />
            <meshStandardMaterial 
                color={material.color}
                roughness={material.roughness}
                metalness={material.metalness}
            />
        </mesh>
    )
}



interface ObstaclesProps {
    obstacles: Obstacle[];
}

export function Obstacles({ obstacles }: ObstaclesProps) {
    return (
        <>
            {obstacles.map((ob, id) => (
                <Obstacle key={id} obstacle={ob} />
            ))}
        </>
    )
}
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
        color: "#808080",
        roughness: 0.9,
        metalness: 0,
    },

    brick: {
        color: "#9a4f3f",
        roughness: 0.9,
        metalness: 0,
    },

    stone: {
        color: "#77756e",
        roughness: 0.95,
        metalness: 0,
    },

    wood: {
        color: "#765438",
        roughness: 0.8,
        metalness: 0,
    },

    metal: {
        color: "#62676b",
        roughness: 0.3,
        metalness: 0.8,
    },

    rustedMetal: {
        color: "#7a4030",
        roughness: 0.85,
        metalness: 0.4,
    },

    glass: {
        color: "#b8d8dc",
        roughness: 0.1,
        metalness: 0,
    },

    grass: {
        color: "#587a3d",
        roughness: 1,
        metalness: 0,
    },

    dirt: {
        color: "#705438",
        roughness: 1,
        metalness: 0,
    },

    sand: {
        color: "#c8b27a",
        roughness: 1,
        metalness: 0,
    },

    gravel: {
        color: "#77736b",
        roughness: 1,
        metalness: 0,
    },

    asphalt: {
        color: "#353535",
        roughness: 0.9,
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
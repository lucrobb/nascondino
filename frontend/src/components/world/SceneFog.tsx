import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Fog } from "three";


interface SceneFogProps {
    maxDistance: number;
}

export function SceneFog({ maxDistance }: SceneFogProps) {
    const { scene } = useThree();

    useEffect(() => {
        scene.fog = new Fog(
            "#2a2a2a",
            maxDistance * 0.1,
            maxDistance
        );
        return () => {
            scene.fog = null;
        }
    }, [scene, maxDistance])

    return null;
}
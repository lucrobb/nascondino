import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Fog } from "three";


interface SceneFogProps {
    maxDistance: number;
    fogColor: string;
}

export function SceneFog({ maxDistance, fogColor }: SceneFogProps) {
    const { scene } = useThree();

    useEffect(() => {
        scene.fog = new Fog(
            fogColor,
            maxDistance * 0.5,
            maxDistance
        );
        return () => {
            scene.fog = null;
        }
    }, [scene, maxDistance])

    return null;
}
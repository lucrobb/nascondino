import type {FacingAngles, Vector3} from '../types';
import { useThree, useFrame } from "@react-three/fiber"
import { useEffect } from 'react';

interface PlayerControllerProps {
    facing: React.RefObject<FacingAngles | null>;
    position: React.RefObject<Vector3 | null>;
    onReadyChange: (ready: boolean) => void;
}


export function PlayerController({ facing, position, onReadyChange }: PlayerControllerProps): null {
    const { camera } = useThree();

    useEffect(() => {
        position.current = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        facing.current = {
            horizontal: camera.rotation.x,
            vertical: camera.rotation.y
        }

        onReadyChange(true);
    }, []);

    useFrame(() => {
        // handle keyboard/mouse movement here

        position.current = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };
        facing.current = {
            horizontal: camera.rotation.x,
            vertical: camera.rotation.y
        }
    });

    return null;
}
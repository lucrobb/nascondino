import type { FacingAngles, Vector3, Movement, Obstacle } from '../../types';
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three";
import { useEffect, useRef } from 'react';


interface PlayerControllerProps {
    facing: React.RefObject<FacingAngles | null>;
    position: React.RefObject<Vector3 | null>;
    playerHeight: number;
    obstacles: Obstacle[];
    groundRef: React.RefObject<THREE.Mesh[]>;
    onMove: (position: Vector3, facing: FacingAngles) => void;
    moveState: React.RefObject<Movement>;
    isFound: boolean;
}


export function PlayerController({ facing, position, playerHeight, obstacles, groundRef, onMove, moveState, isFound }: PlayerControllerProps): null {
    const { camera } = useThree();
    const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
    const yVelocity = useRef<number>(0);

    const MOVE_SPEED: number = 5;

    const timeSinceLastSend = useRef<number>(0);
    const SEND_INTERVAL: number = 1 / 15;

    function getFacing(): FacingAngles {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        const horizontalDist = Math.hypot(forward.x, forward.z);

        return {
            horizontal: Math.atan2(forward.z, forward.x),
            vertical: Math.atan2(forward.y, horizontalDist)
        };
    }
    function getPosition(): Vector3 {
        return {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        }
    }

    function wouldCollide(nextPos: THREE.Vector3): boolean {
        for (const obstacle of obstacles) {
            if (!obstacle.blocksMovement) continue;
            const halfW = obstacle.width / 2;
            const halfD = obstacle.depth / 2;
            if (
                nextPos.x > obstacle.position.x - halfW &&
                nextPos.x < obstacle.position.x + halfW &&
                nextPos.z > obstacle.position.z - halfD &&
                nextPos.z < obstacle.position.z + halfD
            ) {
                return true;
            }
        }
        return false;
    }

    useEffect(() => {
        //Add key event listeners for movement
        function onKeyDown(e: KeyboardEvent) {
            switch (e.code) {
                case "KeyW": moveState.current.forward = Math.min(moveState.current.forward + 1, 1); break;
                case "KeyS": moveState.current.forward = Math.max(moveState.current.forward -1, -1); break;
                case "KeyA": moveState.current.strafe = Math.min(moveState.current.strafe + 1, 1); break;
                case "KeyD": moveState.current.strafe = Math.max(moveState.current.strafe - 1, -1); break;
            }
        }
        function onKeyUp(e: KeyboardEvent) {
            switch (e.code) {
                case "KeyW": moveState.current.forward = Math.max(moveState.current.forward - 1, -1); break;
                case "KeyS": moveState.current.forward = Math.min(moveState.current.forward + 1, 1); break;
                case "KeyA": moveState.current.strafe = Math.max(moveState.current.strafe - 1, -1); break;
                case "KeyD": moveState.current.strafe = Math.min(moveState.current.strafe + 1, 1); break;
            }
        }
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    //Assign facing when necessary (like when server-assigned)
    const initializedFacing = useRef<boolean>(false);

    useFrame((_, delta) => {
      if (facing.current && !initializedFacing.current){
        const { horizontal, vertical } = facing.current;

        const direction = new THREE.Vector3(
            //Importano le proporzioni per la direzione, consideriamo lati come sin e cos direttamente senza applicare dimensioni reali
            Math.cos(vertical) * Math.cos(horizontal),
            Math.sin(vertical),
            Math.cos(vertical) * Math.sin(horizontal)
        );

        camera.lookAt(camera.position.clone().add(direction));
        initializedFacing.current = true;
      }

        const { forward, strafe } = moveState.current;
        timeSinceLastSend.current += delta;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        if (!isFound) {
            direction.y = 0 //movement doesn't depend on y
            //If player is found they can float around at any y axis point as well
        }
        direction.normalize();

        const strafeVector = new THREE.Vector3();
        strafeVector.crossVectors(camera.up, direction).normalize() //Direction perpendicular to facing 
        
        //Vector operations to construct the move vector to add to position
        const move = new THREE.Vector3();
        move.add(strafeVector.multiplyScalar(strafe * MOVE_SPEED * delta));
        move.add(direction.multiplyScalar(forward * MOVE_SPEED * delta));

        if (move.lengthSq() > 0) {
            
            //check x-axis collision
            const nextX = camera.position.clone();
            nextX.x += move.x;
            if (!wouldCollide(nextX) || isFound) {
                camera.position.x = nextX.x;
            }

            //next y axis position, only ever calculated if the user is found, otherwise direction.y = 0
            camera.position.y += move.y;
            

            //check z-axis collision
            const nextZ = camera.position.clone();
            nextZ.z += move.z;
            if (!wouldCollide(nextZ) || isFound) {
                camera.position.z = nextZ.z
            }
        }

        //To calculate y position we use a raycast to find the y value of the ground underneath
        if (!isFound) {
            raycaster.current.set(
                //Starting position directly above the player
                new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z),
                new THREE.Vector3(0, -1, 0) //Looking straight down
            )
            const hits = raycaster.current.intersectObjects(groundRef.current, true);
            if (hits.length > 0) {
                const groundY = hits[0].point.y;
                const targetY = groundY + playerHeight;

                yVelocity.current += -9.81 * delta;
                camera.position.y = Math.max(
                    camera.position.y + yVelocity.current * delta,
                    targetY
                );

                if (camera.position.y === targetY) {
                    yVelocity.current = 0;
                }
            }

            position.current = getPosition();
            facing.current = getFacing();

            if (timeSinceLastSend.current >= SEND_INTERVAL) {
                timeSinceLastSend.current = 0;
                onMove(position.current, facing.current);
            }
        }
    });

    return null;
}
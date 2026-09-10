import { useThree } from "@react-three/fiber";
import { Raycaster, Vector2 } from "three";
import { useEffect, useRef } from "react";

interface CaptureConrollerProps {
    onCapture: (targetId: string) => void;
}

export function CaptureController({ onCapture }: CaptureConrollerProps): null {
    const { camera, scene, gl } = useThree();
    const raycaster = useRef<Raycaster>(new Raycaster());

    useEffect(() => {
        function onClick() {
            raycaster.current.setFromCamera(new Vector2(0, 0), camera);
            const hits = raycaster.current.intersectObjects(scene.children, true);

            if (hits.length > 0 && hits[0].object.userData.playerId) {
                const targetId: string = hits[0].object.userData.playerId;
                onCapture(targetId);
            }
        }

        gl.domElement.addEventListener("click", onClick);
        return () => gl.domElement.removeEventListener("click", onClick);
    }, [camera, scene, gl])

    return null;
}
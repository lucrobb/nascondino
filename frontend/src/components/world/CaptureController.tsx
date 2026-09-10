import { useThree } from "@react-three/fiber";
import { Raycaster, Vector2 } from "three";
import { useEffect } from "react";

interface CaptureConrollerProps {
    onCapture: (targetId: string) => void;
}

export function CaptureController({ onCapture }: CaptureConrollerProps): null {
    const { camera, scene, gl } = useThree();
    const raycaster = new Raycaster();

    useEffect(() => {
        function onClick() {
            raycaster.setFromCamera(new Vector2(0, 0), camera);
            const hits = raycaster.intersectObjects(scene.children, true);

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
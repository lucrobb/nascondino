import { useRef } from "react";
import type { Camera } from "three";


const SENSITIVITY = 0.005;
const MAX_VERTICAL_ANGLE = Math.PI / 2 - 0.05;

interface CameraTouchProps {
    camera: Camera;
}

export function CameraTouch({ camera }: CameraTouchProps) {

    const pointerId = useRef<number | null>(null);
    const lastPosition = useRef({ x: 0, y: 0 });

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (pointerId.current !== null) return;

        pointerId.current = e.pointerId;

        lastPosition.current = {
            x: e.clientX,
            y: e.clientY,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerId !== pointerId.current) return;

        const dx = e.clientX - lastPosition.current.x;
        const dy = e.clientY - lastPosition.current.y;

        lastPosition.current = {
            x: e.clientX,
            y: e.clientY,
        };

        camera.rotation.y -= dx * SENSITIVITY;
        camera.rotation.x -= dy * SENSITIVITY;

        camera.rotation.x = Math.max(
            -MAX_VERTICAL_ANGLE,
            Math.min(MAX_VERTICAL_ANGLE, camera.rotation.x)
        );
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerId !== pointerId.current) return;

        pointerId.current = null;
    }

    return (
        <div
            className="fixed inset-y-0 right-0 z-40 w-1/2 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        />
    );
}
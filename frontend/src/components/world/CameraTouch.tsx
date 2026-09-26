import { useRef } from "react";
import * as THREE from "three";

const SENSITIVITY = 0.005;
const MAX_PITCH = Math.PI / 2 - 0.05;

interface CameraTouchProps {
    camera: THREE.Camera;
}

export function CameraTouch({ camera }: CameraTouchProps) {
    const pointerId = useRef<number | null>(null);

    const lastPosition = useRef({
        x: 0,
        y: 0,
    });

    const yaw = useRef(0);
    const pitch = useRef(0);

    const initialized = useRef(false);

    function initializeRotation() {
        if (initialized.current) return;

        const euler = new THREE.Euler().setFromQuaternion(
            camera.quaternion,
            "YXZ"
        );

        yaw.current = euler.y;
        pitch.current = euler.x;

        initialized.current = true;
    }

    function handlePointerDown(
        e: React.PointerEvent<HTMLDivElement>
    ) {
        if (pointerId.current !== null) return;

        initializeRotation();

        pointerId.current = e.pointerId;

        lastPosition.current = {
            x: e.clientX,
            y: e.clientY,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(
        e: React.PointerEvent<HTMLDivElement>
    ) {
        if (e.pointerId !== pointerId.current) return;

        const dx =
            e.clientX - lastPosition.current.x;

        const dy =
            e.clientY - lastPosition.current.y;

        lastPosition.current = {
            x: e.clientX,
            y: e.clientY,
        };

        yaw.current -= dx * SENSITIVITY;
        pitch.current -= dy * SENSITIVITY;

        pitch.current = THREE.MathUtils.clamp(
            pitch.current,
            -MAX_PITCH,
            MAX_PITCH
        );

        camera.rotation.set(
            pitch.current,
            yaw.current,
            0,
            "YXZ"
        );
    }

    function handlePointerUp(
        e: React.PointerEvent<HTMLDivElement>
    ) {
        if (e.pointerId !== pointerId.current) return;

        pointerId.current = null;
    }

    return (
        <div
            className="fixed inset-y-0 right-0 z-10 w-1/2 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        />
    );
}
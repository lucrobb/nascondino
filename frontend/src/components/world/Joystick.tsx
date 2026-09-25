
import { useRef } from "react";
import type { Movement } from '../../types';


type JoystickProps = {
    moveState: React.RefObject<Movement>;
};

const JOYSTICK_RADIUS = 50;

export function Joystick({ moveState }: JoystickProps) {
    const joystickRef = useRef<HTMLDivElement | null>(null);
    const pointerId = useRef<number | null>(null);
    const startPosition = useRef({ x: 0, y: 0 });

    function updateJoystick(clientX: number, clientY: number) {
        const dx = clientX - startPosition.current.x;
        const dy = clientY - startPosition.current.y;

        //convert to scale from 0 to 1
        let x = dx / JOYSTICK_RADIUS;
        let y = dy / JOYSTICK_RADIUS;

        // Clamp the joystick to a maximum magnitude of 1.
        const length = Math.hypot(x, y);
        
        //L^2 = x^2 + y^2 (Pithagorus), so (x / L)^2 + (y / L)^2 = (x^2 + y^2) / L^2 = 1, so the length becomes 1 in total
         if (length > 1) {
            x /= length;
            y /= length;
        }

        // Moving the joystick upward should mean moving forward.
        moveState.current.strafe = x;
        moveState.current.forward = -y;
    }

    function resetJoystick() {
        pointerId.current = null;

        moveState.current.forward = 0;
        moveState.current.strafe = 0;

        if (joystickRef.current) {
            joystickRef.current.style.transform = "translate(-50%, -50%)";
        }
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (pointerId.current !== null) return;

        pointerId.current = e.pointerId;

        startPosition.current = {
            x: e.clientX,
            y: e.clientY,
        };

        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerId !== pointerId.current) return;

        updateJoystick(e.clientX, e.clientY);

        // Visual position of the joystick thumb.
        const dx = e.clientX - startPosition.current.x;
        const dy = e.clientY - startPosition.current.y;

        let x = dx;
        let y = dy;

        const length = Math.hypot(x, y);

        if (length > JOYSTICK_RADIUS) {
            x = (x / length) * JOYSTICK_RADIUS;
            y = (y / length) * JOYSTICK_RADIUS;
        }

        if (joystickRef.current) {
            joystickRef.current.style.transform =
                `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        }
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (e.pointerId !== pointerId.current) return;

        resetJoystick();
    }

    return (
        <div
            className="fixed bottom-8 left-8 z-50 h-32 w-32 rounded-full border-2 border-white/30 bg-black/20 backdrop-blur-sm touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div
                ref={joystickRef}
                className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/70 shadow-lg"
            />
        </div>
    );
}

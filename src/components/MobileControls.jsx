import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';

const Joystick = ({ onMove, label, side = "left" }) => {
    const containerRef = useRef(null);
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const touchId = useRef(null);

    const maxRadius = 50; // Max distance for the stick

    const updatePosition = (clientX, clientY) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let x = dx;
        let y = dy;

        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            x = Math.cos(angle) * maxRadius;
            y = Math.sin(angle) * maxRadius;
        }

        setPosition({ x, y });

        // Normalize output -1 to 1
        // For Move: Y is inverted (Up is negative in screen, but we want positive for forward)
        // Actually standard: Up (Screen -Y) -> Forward (+?) depends on 3D logic.
        // Let's send raw normalized X/Y (-1 to 1) where Right is +X, Down is +Y
        onMove(x / maxRadius, y / maxRadius);
    };

    const handlePointerDown = (e) => {
        e.preventDefault(); // Prevent scrolling
        if (touchId.current !== null) return;

        // Only accept left/right touches based on side? 
        // Actually the container is already positioned, so just taking any touch inside it is fine.

        touchId.current = e.pointerId;
        containerRef.current.setPointerCapture(e.pointerId);
        setActive(true);
        updatePosition(e.clientX, e.clientY);
    };

    const handlePointerMove = (e) => {
        if (!active || e.pointerId !== touchId.current) return;
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
    };

    const handlePointerUp = (e) => {
        if (e.pointerId !== touchId.current) return;
        setActive(false);
        setPosition({ x: 0, y: 0 });
        onMove(0, 0);
        touchId.current = null;
    };

    const style = {
        position: 'absolute',
        bottom: '50px',
        [side === 'left' ? 'left' : 'right']: '50px',
        width: '120px',
        height: '120px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        touchAction: 'none',
        border: '2px solid rgba(0, 255, 255, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto' // Ensure it captures clicks
    };

    const stickStyle = {
        width: '40px',
        height: '40px',
        background: active ? 'cyan' : 'rgba(0, 255, 255, 0.5)',
        borderRadius: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: active ? 'none' : 'transform 0.1s ease-out',
        boxShadow: '0 0 10px cyan'
    };

    return (
        <div
            ref={containerRef}
            style={style}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div style={stickStyle} />
            <div style={{ position: 'absolute', bottom: '-30px', color: 'white', fontSize: '10px', pointerEvents: 'none' }}>
                {label}
            </div>
        </div>
    );
};

export function MobileControls() {
    const setJoystick = useStore((state) => state.setJoystick);
    const setJoystickLook = useStore((state) => state.setJoystickLook);

    // Check if likely mobile (simplistic check, but good enough for now)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 800;

    if (!isMobile) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Let clicks pass through to canvas (except joysticks)
            zIndex: 2000
        }}>
            <Joystick
                side="left"
                label="MOVE"
                onMove={(x, y) => setJoystick(x, y)}
            />

            <Joystick
                side="right"
                label="LOOK"
                onMove={(x, y) => setJoystickLook(x, y)}
            />
        </div>
    );
}

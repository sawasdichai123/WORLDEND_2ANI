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
        onMove(x / maxRadius, y / maxRadius);
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        if (touchId.current !== null) return;
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

    // --- STYLES ---
    const containerStyle = {
        position: 'absolute',
        bottom: '80px',
        [side === 'left' ? 'left' : 'right']: '40px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        touchAction: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto',
        // Holographic Backplate
        background: active
            ? 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0, 255, 255, 0.02) 0%, transparent 60%)',
        border: `1px solid ${active ? 'rgba(0, 255, 255, 0.5)' : 'rgba(0, 255, 255, 0.15)'}`,
        boxShadow: active ? '0 0 15px rgba(0, 255, 255, 0.2)' : 'none',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(2px)'
    };

    const stickStyle = {
        position: 'absolute',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: active ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Spring back
        // Stick Look
        background: 'rgba(0, 0, 0, 0.5)',
        border: '2px solid cyan',
        boxShadow: `0 0 10px cyan, inset 0 0 10px rgba(0,255,255,0.5)`,
        zIndex: 2
    };

    // Decorative Crosshair / Ticks
    const Tick = ({ rotation }) => (
        <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '100%', height: '2px',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            pointerEvents: 'none'
        }}>
            <div style={{ position: 'absolute', left: '0', width: '10px', height: '100%', background: 'cyan', opacity: 0.3 }} />
            <div style={{ position: 'absolute', right: '0', width: '10px', height: '100%', background: 'cyan', opacity: 0.3 }} />
        </div>
    );

    return (
        <div
            ref={containerRef}
            style={containerStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Visual Decor */}
            <Tick rotation={0} />
            <Tick rotation={90} />
            {/* Inner Ring */}
            <div style={{
                position: 'absolute', width: '60%', height: '60%',
                border: '1px dashed rgba(0,255,255,0.1)', borderRadius: '50%', pointerEvents: 'none'
            }} />

            {/* The Stick */}
            <div style={stickStyle} />

            {/* Label */}
            <div style={{
                position: 'absolute', bottom: '-25px',
                color: 'cyan', fontSize: '10px',
                letterSpacing: '2px', opacity: 0.8,
                pointerEvents: 'none', textShadow: '0 0 5px cyan'
            }}>
                {label}
            </div>
        </div>
    );
};

export function MobileControls() {
    const setJoystick = useStore((state) => state.setJoystick);
    const setJoystickLook = useStore((state) => state.setJoystickLook);

    // Simple Mobile Check
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => {
            const narrow = window.innerWidth < 900;
            const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            setIsMobile(narrow || touch);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!isMobile) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2000,
            userSelect: 'none',
            WebkitUserSelect: 'none'
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

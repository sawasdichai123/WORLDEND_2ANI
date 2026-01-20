import React from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

export function PortraitCanvas({ url, position, rotation, label = "ARTWORK", description = "", neonColor = "magenta" }) {
    // Load texture with fallback
    const texture = useTexture(url);

    const width = 4;
    const height = 5;
    const frameThick = 0.2;
    const frameDepth = 0.3;

    return (
        <group position={position} rotation={rotation}>
            {/* 1. Main Frame Structure */}

            {/* Top Bar */}
            <mesh position={[0, height / 2 + frameThick / 2, 0]}>
                <boxGeometry args={[width + frameThick * 2, frameThick, frameDepth]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Bottom Bar */}
            <mesh position={[0, -(height / 2 + frameThick / 2), 0]}>
                <boxGeometry args={[width + frameThick * 2, frameThick, frameDepth]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Left Bar */}
            <mesh position={[-(width / 2 + frameThick / 2), 0, 0]}>
                <boxGeometry args={[frameThick, height + frameThick * 2, frameDepth]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Right Bar */}
            <mesh position={[width / 2 + frameThick / 2, 0, 0]}>
                <boxGeometry args={[frameThick, height + frameThick * 2, frameDepth]} />
                <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 2. Neon Accents (Vertical Strips inside frame) */}
            <mesh position={[-(width / 2), 0, 0.05]}>
                <boxGeometry args={[0.05, height, 0.05]} />
                <meshBasicMaterial color={neonColor} toneMapped={false} />
            </mesh>
            <mesh position={[width / 2, 0, 0.05]}>
                <boxGeometry args={[0.05, height, 0.05]} />
                <meshBasicMaterial color={neonColor} toneMapped={false} />
            </mesh>

            {/* 3. Glass Backing / Dark Background */}
            <mesh position={[0, 0, -0.05]}>
                <planeGeometry args={[width, height]} />
                <meshPhysicalMaterial
                    color="#000"
                    metalness={0.5}
                    roughness={0.2}
                    transmission={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* 4. The Artwork Canvas */}
            {texture && (
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[width - 0.2, height - 0.2]} />
                    {/* ADJUST BRIGHTNESS HERE: color=Tint, emissiveIntensity=Self-Glow amount */}
                    <meshStandardMaterial
                        map={texture}
                        color="#ffffff"
                        emissive="#ffffff"
                        emissiveIntensity={-0.2}
                        roughness={0.6}
                        metalness={0.1}
                    />
                </mesh>
            )}

            {/* 5. Label / Title */}
            <group position={[0, -(height / 2 + 0.65), 0]}> {/* Moved down slightly for larger box */}
                {/* Backing plate */}
                <mesh>
                    <planeGeometry args={[width, 0.9]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
                {/* Inner black area */}
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[width - 0.2, 0.8]} />
                    <meshBasicMaterial color="#000" />
                </mesh>

                {/* Main Title */}
                <Text position={[0, 0.15, 0.02]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" letterSpacing={0.1}>
                    {label}
                </Text>

                {/* Subtitle / Description */}
                <Text position={[0, -0.15, 0.02]} fontSize={0.15} color={neonColor} anchorX="center" anchorY="middle" letterSpacing={0.05}>
                    {description}
                </Text>
            </group>
        </group>
    );
}

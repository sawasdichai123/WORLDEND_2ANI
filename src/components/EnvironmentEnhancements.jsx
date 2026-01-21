import React from 'react';
import { Sparkles, SpotLight } from '@react-three/drei';

export function EnvironmentEnhancements() {
    return (
        <group>
            {/* 1. Hallway Particles (Restricted to Hallway Z > -15) */}
            <Sparkles
                count={500}
                scale={[25, 20, 65]}
                size={4}
                speed={0.4}
                opacity={0.5}
                color="#00ffff"
                position={[0, 10, 20]}
            />

            {/* 3. Volumetric "God Rays" for Key Areas */}
            {/* Center Stage Spotlight */}
            <SpotLight
                position={[0, 20, 0]}
                target-position={[0, 0, 0]}
                angle={0.5}
                penumbra={0.5}
                distance={30}
                attenuation={10}
                anglePower={5}
                intensity={2}
                color="cyan"
                opacity={0.5} // Volumetric intensity
            />

            {/* 4. Fog Environment (Cyberpunk Haze) */}
            <fogExp2 attach="fog" args={['#050505', 0.02]} />
        </group>
    );
}

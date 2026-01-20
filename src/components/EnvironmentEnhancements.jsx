import React from 'react';
import { Sparkles, SpotLight } from '@react-three/drei';

export function EnvironmentEnhancements() {
    return (
        <group>
            {/* 1. Global Particles (Dust/Data Motes) */}
            <Sparkles
                count={500}
                scale={[40, 20, 40]}
                size={4}
                speed={0.4}
                opacity={0.5}
                color="#00ffff"
                position={[0, 10, 0]}
            />

            {/* 2. Secondary Particles (Floor drift) */}
            <Sparkles
                count={200}
                scale={[30, 2, 30]}
                size={2}
                speed={0.2}
                opacity={0.3}
                color="#ff00ff"
                position={[0, 1, 0]}
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

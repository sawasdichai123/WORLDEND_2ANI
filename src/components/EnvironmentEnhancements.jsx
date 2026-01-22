import React, { useRef, useMemo } from 'react';
import { SpotLight } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FallingParticles({ count = 80 }) {
    const mesh = useRef();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const yStart = Math.random() * 20; // Start at random height initially to fill space
            temp.push({
                x: (Math.random() - 0.5) * 25,
                y: yStart,
                z: (Math.random() - 0.5) * 65 + 20, // Match original hallway range
                rotation: { x: Math.random() * Math.PI, y: Math.random() * Math.PI, z: Math.random() * Math.PI },
                speed: 0.005 + Math.random() * 0.015, // Even slower falling speed
                rotSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                disappearY: Math.random() * 2 + 0.5 // Random disappear height between 0.5 and 2.5
            });
        }
        return temp;
    }, [count]);

    useFrame(() => {
        if (!mesh.current) return;

        particles.forEach((particle, i) => {
            // Update Position
            particle.y -= particle.speed;

            // Update Rotation
            particle.rotation.x += particle.rotSpeed.x;
            particle.rotation.y += particle.rotSpeed.y;
            particle.rotation.z += particle.rotSpeed.z;

            // Reset if fully disappeared (below 0 or a bit lower)
            if (particle.y < 0) {
                particle.y = 20;
                particle.x = (Math.random() - 0.5) * 25;
                particle.z = (Math.random() - 0.5) * 65 + 20;
                // Reset rotation slightly to keep it varied
                particle.rotation.x = Math.random() * Math.PI;
                particle.rotation.y = Math.random() * Math.PI;
                particle.rotation.z = Math.random() * Math.PI;
            }

            // Calculate Scale for Disappearance
            let s = 1;
            // Start fading out when Y is below disappearY
            if (particle.y < particle.disappearY) {
                // Scale from 1 to 0 as it goes from disappearY to 0
                s = particle.y / particle.disappearY;
                if (s < 0) s = 0;
            }

            // Apply to Dummy
            dummy.position.set(particle.x, particle.y, particle.z);
            dummy.rotation.set(particle.rotation.x, particle.rotation.y, particle.rotation.z);
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            {/* 3D Triangle (Tetrahedron) for the 'shard' look */}
            <tetrahedronGeometry args={[0.15, 0]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.8} side={THREE.DoubleSide} />
        </instancedMesh>
    );
}

export function EnvironmentEnhancements() {
    return (
        <group>
            {/* 1. Hallway Particles - Replacing Sparkles with FallingParticles */}
            <FallingParticles count={80} />

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

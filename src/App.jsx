import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sky, Text, Box, useTexture, KeyboardControls, useKeyboardControls, Environment, Text3D, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// 1. สร้าง Component สำหรับควบคุมการเดิน
function Player() {
  const [, getKeys] = useKeyboardControls();
  const speed = 0.1;

  useFrame((state) => {
    const { forward, backward, left, right } = getKeys();
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward));
    const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(state.camera.rotation);

    state.camera.position.add(new THREE.Vector3(direction.x, 0, direction.z));
  });

  return null;
}

// 2. คอมโพเนนต์แสดงรูปภาพ (ปรับปรุงเรื่องความเสถียร)
function LoreFrame({ url, position, rotation = [0, 0, 0], name, description }) {
  // ใส่ fallback สีพื้นหลังกรณีโหลดรูปไม่ขึ้น
  const texture = useTexture(url);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial map={texture} />
      </mesh>

      {/* ปรับแต่ง Font เล็กน้อยให้ชัดขึ้น */}
      <Text position={[0, -2.5, 0]} fontSize={0.3} color="#00ffff" anchorY="top">
        {name}
      </Text>
      <Text position={[0, -3.2, 0]} fontSize={0.15} maxWidth={2.5} textAlign="center" anchorY="top">
        {description}
      </Text>

      {/* กรอบหลัง */}
      <Box args={[3.2, 4.2, 0.1]} position={[0, 0, -0.1]}>
        <meshStandardMaterial color="#111" />
      </Box>
    </group>
  );
}

export default function App() {
  return (
    // 3. ห่อด้วย KeyboardControls เพื่อให้ใช้ WASD ได้
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
        <Canvas camera={{ fov: 40, position: [0, 2, 20] }} shadows gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5, outputColorSpace: THREE.SRGBColorSpace }}>
          {/* 1. Post Processing - The "Cinematic" Look */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>

          {/* 2. Environment & Lighting */}
          {/* HDRI for realistic reflections */}
          <Environment preset="city" background={false} blur={0.8} />

          {/* Atmosphere & Background */}
          <color attach="background" args={['#050505']} />
          <fogExp2 attach="fog" args={['#050505', 0.03]} />

          {/* Lighting System */}
          <ambientLight intensity={0.15} /> {/* Low ambient for contrast */}
          <spotLight position={[0, 15, 10]} angle={0.6} penumbra={0.5} intensity={2} castShadow color="#ffffff" />

          <Suspense fallback={null}>
            <Player />

            {/* Main Hall Structure */}

            {/* Floor */}
            {/* Reflective Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
              <planeGeometry args={[50, 100]} />
              <MeshReflectorMaterial
                mirror={0.7}
                blur={[500, 500]}
                resolution={2048}
                mixBlur={2}
                mixStrength={60}
                roughness={0.8}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#101010"
                metalness={0.6}
              />
            </mesh>

            {/* Neon Floor Strips */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.01, 0]}>
              <planeGeometry args={[0.2, 100]} />
              <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, 0.01, 0]}>
              <planeGeometry args={[0.2, 100]} />
              <meshBasicMaterial color="#ff00ff" toneMapped={false} />
            </mesh>

            {/* Ceiling - Dark with faint grid */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 15, 0]}>
              <planeGeometry args={[50, 100]} />
              <meshStandardMaterial color="#050505" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>

            {/* Walls */}
            <mesh position={[-12, 7.5, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[100, 15]} />
              <meshStandardMaterial color="#020202" roughness={0.8} />
            </mesh>
            <mesh position={[12, 7.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[100, 15]} />
              <meshStandardMaterial color="#020202" roughness={0.8} />
            </mesh>

            {/* End Wall */}
            <mesh position={[0, 7.5, -25]}>
              <planeGeometry args={[50, 15]} />
              <meshStandardMaterial color="#000" />
            </mesh>

            {/* Pillars with Neon Accents */}
            {[-10, -5, 0, 5, 10].map((zPos, i) => (
              <React.Fragment key={i}>
                {/* Left Pillar */}
                <group position={[-10, 7.5, zPos]}>
                  <mesh>
                    <boxGeometry args={[1, 15, 1]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  {/* Neon strip on pillar */}
                  <mesh position={[0.51, 0, 0]}>
                    <planeGeometry args={[0.1, 12]} />
                    <meshBasicMaterial color="cyan" toneMapped={false} />
                  </mesh>
                </group>

                {/* Right Pillar */}
                <group position={[10, 7.5, zPos]}>
                  <mesh>
                    <boxGeometry args={[1, 15, 1]} />
                    <meshStandardMaterial color="#111" />
                  </mesh>
                  {/* Neon strip on pillar */}
                  <mesh position={[-0.51, 0, 0]}>
                    <planeGeometry args={[0.1, 12]} />
                    <meshBasicMaterial color="magenta" toneMapped={false} />
                  </mesh>
                </group>
              </React.Fragment>
            ))}


            {/* Left Side Characters */}
            <group>
              <spotLight position={[-8, 10, 8]} target-position={[-8, 3, 5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="cyan" />
              <LoreFrame url="/assets/Xonebu.jpg" position={[-8, 3.5, 5]} rotation={[0, Math.PI / 2, 0]} name="XONEBU" description="ALIEN / X01" />
            </group>

            <group>
              <spotLight position={[-8, 10, 3]} target-position={[-8, 3, 0]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="cyan" />
              <LoreFrame url="/assets/AMI.jpg" position={[-8, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} name="BETA AMI" description="ANDROID / GUARDIAN" />
            </group>

            <group>
              <spotLight position={[-8, 10, -2]} target-position={[-8, 3, -5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="cyan" />
              <LoreFrame url="/assets/Ahyra.jpg" position={[-8, 3.5, -5]} rotation={[0, Math.PI / 2, 0]} name="ASHYRA" description="ENERGY / 300%" />
            </group>

            {/* Right Side Characters */}
            <group>
              <spotLight position={[8, 10, 8]} target-position={[8, 3, 5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <LoreFrame url="/assets/Debirun.jpg" position={[8, 3.5, 5]} rotation={[0, -Math.PI / 2, 0]} name="DEBIRUN" description="COMMANDER / METEOR" />
            </group>

            <group>
              <spotLight position={[8, 10, 3]} target-position={[8, 3, 0]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <LoreFrame url="/assets/Tsururu.jpg" position={[8, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} name="TSURURU" description="CLOUD / HIGH ALTITUDE" />
            </group>

            <group>
              <spotLight position={[8, 10, -2]} target-position={[8, 3, -5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <LoreFrame url="/assets/MildR.jpg" position={[8, 3.5, -5]} rotation={[0, -Math.PI / 2, 0]} name="MILD-R" description="MUTANT / HEALER" />
            </group>

            {/* 5. Giant Glowing Title */}
            <Text
              position={[0, 8, -20]}
              fontSize={2}
              color="white"
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              anchorX="center"
              anchorY="middle"
            >
              WORLD END
              <meshBasicMaterial toneMapped={false} color="white" />
            </Text>
            <Text
              position={[0, 6, -20]}
              fontSize={1}
              color="#aaa"
              font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
              anchorX="center"
              anchorY="middle"
            >
              2nd ANNIVERSARY EXHIBITION
            </Text>
          </Suspense>

          <PointerLockControls />
        </Canvas>

        {/* UI Overlay */}
        <div style={{
          position: 'absolute', top: 40, left: 40, color: 'white',
          fontFamily: "'Segoe UI', Roboto, sans-serif", pointerEvents: 'none',
          textShadow: '0px 0px 10px rgba(0,255,255,0.5)'
        }}>
          <h1 style={{ margin: 0, fontWeight: 300, fontSize: '2.5rem', letterSpacing: '0.2rem', textTransform: 'uppercase' }}>World End</h1>
          <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: '#888', letterSpacing: '0.1rem' }}>DIGITAL EXHIBITION</h2>
          <div style={{ marginTop: 20, fontSize: '0.8rem', color: '#666' }}>
            <span style={{ border: '1px solid #444', padding: '5px 10px', borderRadius: 4 }}>WASD to Walk</span>
            <span style={{ marginLeft: 10, border: '1px solid #444', padding: '5px 10px', borderRadius: 4 }}>Mouse to Look</span>
          </div>
        </div>
      </div>
    </KeyboardControls>

  );
}
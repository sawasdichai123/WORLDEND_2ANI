import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sky, Text, Box, useTexture, KeyboardControls, useKeyboardControls, Environment, Text3D, MeshReflectorMaterial, useVideoTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { EnvironmentEnhancements } from './components/EnvironmentEnhancements';
import { WelcomeScreen } from './components/WelcomeScreen';


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

// 4. MV Player & Components
function VideoDisplay({ texture, isPlaying }) {
  // Sync Playback
  React.useEffect(() => {
    if (texture?.image) {
      if (isPlaying) {
        texture.image.play().catch(e => console.log("Video Play Error:", e));
      } else {
        texture.image.pause();
      }
    }
  }, [isPlaying, texture]);

  return (
    <mesh>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

// 5. Dynamic Reticle (Cursor)
function Reticle() {
  const [opacity, setOpacity] = useState(0);
  const timeoutRef = useRef(null);

  React.useEffect(() => {
    const handleMouseMove = () => {
      setOpacity(1); // Show immediately
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Hide after 2 seconds of no movement
      timeoutRef.current = setTimeout(() => setOpacity(0), 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', // Fixed ensures it centers to screen, not parent container
      top: '50%',
      left: '50%',
      width: '8px',
      height: '8px',
      backgroundColor: 'white',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      opacity: opacity,
      transition: 'opacity 0.3s ease',
      zIndex: 1000,
      boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)'
    }} />
  );
}

function ControlButton({ position, label, onClick, color = "#00ffff", size = 0.15 }) {
  const [hovered, setHover] = useState(false);
  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color={hovered ? "white" : color} toneMapped={false} />
      </mesh>
      <Text position={[0, -size - 0.05, 0]} fontSize={0.08} color="white" anchorX="center" anchorY="top">
        {label}
      </Text>
    </group>
  );
}

function ControlPanel({ isPlaying, setIsPlaying, videoElement }) {
  const [hovered, setHover] = useState(false);
  const [volume, setVolume] = useState(100); // Track volume as percentage (0-100)

  // Helper actions
  const skip = (seconds) => {
    if (videoElement) videoElement.currentTime += seconds;
  };
  const restart = () => {
    if (videoElement) {
      videoElement.currentTime = 0;
      videoElement.play();
      setIsPlaying(true);
    }
  };
  const adjustVolume = (amount) => {
    if (videoElement) {
      videoElement.muted = false; // Ensure unmuted when changing volume
      // Calculate new volume
      const newVol = Math.max(0, Math.min(1, videoElement.volume + amount));
      videoElement.volume = newVol;
      setVolume(Math.round(newVol * 100)); // Update state
    }
  };

  return (
    <group position={[0, 0.7, 8]}>
      {/* 1. Kiosk Structure */}
      {/* Main Stand (Solid Tower) */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[0.8, 2.4, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Angled Console Top */}
      <mesh position={[0, 0.5, 0]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[2.2, 1.6, 0.2]} />
        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Neon Accents on Stand */}
      <mesh position={[0, -1.2, 0.31]}>
        <boxGeometry args={[0.05, 2.4, 0.05]} />
        <meshBasicMaterial color="cyan" toneMapped={false} />
      </mesh>

      {/* 2. Embedded Glass Interface (Placed ON the angled console) */}
      {/* Tightened Z from 0.13 to 0.102 for flush look (embedded screen) */}
      <group position={[0, 0.5, 0.102]} rotation={[-0.5, 0, 0]}>
        {/* Glass Panel Surface */}
        <mesh>
          <boxGeometry args={[2, .2, 0.02]} />
          <meshPhysicalMaterial
            color="black"
            transparent
            opacity={0.9}
            roughness={0.1}
            metalness={0.8}
            transmission={0} // Opaque screen look
            thickness={0}
          />
        </mesh>

        {/* Glowing Rim */}
        <mesh>
          <boxGeometry args={[2.02, 1.42, 0.04]} />
          <meshBasicMaterial color="#00ffff" wireframe />
        </mesh>

        {/* --- CONTROLS --- */}\n
        {/* Center: Play/Pause (Standardized Button) */}
        <ControlButton
          position={[0, 0, 0.04]}
          label={isPlaying ? "PAUSE" : "PLAY"}
          onClick={() => setIsPlaying(!isPlaying)}
          color={isPlaying ? "#ff3333" : "#00ffff"}
        />

        {/* Top: Restart */}
        <ControlButton position={[0, 0.45, 0.04]} label="RESTART" onClick={restart} color="#ffcc00" />

        {/* Left/Right: Skip */}
        <ControlButton position={[-0.7, 0, 0.04]} label="-10s" onClick={() => skip(-10)} />
        <ControlButton position={[0.7, 0, 0.04]} label="+10s" onClick={() => skip(10)} />

        {/* Bottom: Volume Controls */}
        <ControlButton position={[-0.5, -0.4, 0.04]} label="VOL -" onClick={() => adjustVolume(-0.1)} color="#00ff00" />

        {/* Volume Display Text */}
        <Text
          position={[0, -0.4, 0.04]}
          fontSize={0.1}
          color="#00ff00"
          anchorX="center"
          anchorY="middle"
        >
          {`VOL: ${volume}%`}
        </Text>

        <ControlButton position={[0.5, -0.4, 0.04]} label="VOL +" onClick={() => adjustVolume(0.1)} color="#00ff00" />

        {/* Main Hitbox */}
        <mesh
          position={[0, 0, 0.03]}
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            // Default to play/pause if not clicking specific buttons
            // But since buttons are on top, they catch events first if z is higher?
            // Actually, let's just leave the buttons to handle themselves.
            // This hitbox is fallback if user misses a button but hits panel.
            setIsPlaying(!isPlaying);
          }}
        >
          <boxGeometry args={[2, 1.2, 0.01]} />
          <meshBasicMaterial color="red" />
        </mesh>
      </group>
    </group>
  );
}

function Stage({ isPlaying, setIsPlaying }) {
  // Lifted state: Load texture here
  const texture = useVideoTexture("/assets/Mvtest.mp4", { start: false, muted: false });

  return (
    <group position={[0, 0, -28]}>
      {/* 1. Stage Platform */}
      <mesh position={[0, 1, 0]} receiveShadow>
        <boxGeometry args={[30, 2, 15]} />
        <meshStandardMaterial color="#050505" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Neon Edges */}
      <mesh position={[0, 1.1, -7.55]}>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshBasicMaterial color="#00ffff" toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.1, 7.55]}>
        <boxGeometry args={[30, 0.1, 0.1]} />
        <meshBasicMaterial color="#ff00ff" toneMapped={false} />
      </mesh>

      {/* 2. Video Screen with Metallic Frame & Speakers */}
      <group position={[0, 6.5, -2]}>
        {/* The Screen Itself */}
        <VideoDisplay texture={texture} isPlaying={isPlaying} />

        {/* --- FRAME STRUCTURE --- */}
        {/* Top Bar */}
        <mesh position={[0, 4.7, 0]}>
          <boxGeometry args={[17, 0.4, 0.5]} />
          <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* Bottom Bar */}
        <mesh position={[0, -4.7, 0]}>
          <boxGeometry args={[17, 0.4, 0.5]} />
          <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* Left Vertical Frame */}
        <mesh position={[-8.7, 0, 0]}>
          <boxGeometry args={[0.4, 9.8, 0.5]} />
          <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* Right Vertical Frame */}
        <mesh position={[8.7, 0, 0]}>
          <boxGeometry args={[0.4, 9.8, 0.5]} />
          <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* --- SPEAKERS --- */}
        {/* Left Speaker Column */}
        <mesh position={[-11, 0, 0.2]}>
          <boxGeometry args={[3, 9, 1]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.5} />
        </mesh>
        {/* Speaker Rings (Left = Cyan) */}
        {[-3, -1, 1, 3].map((y, i) => (
          <group key={i} position={[-11, y, 0.71]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Main Cone */}
            <mesh>
              <cylinderGeometry args={[1, 1, 0.1, 32]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* Neon Ring */}
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.05, 16, 32]} />
              <meshBasicMaterial color="#00ffff" toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Right Speaker Column */}
        <mesh position={[11, 0, 0.2]}>
          <boxGeometry args={[3, 9, 1]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.5} />
        </mesh>
        {/* Speaker Rings (Right = Magenta) */}
        {[-3, -1, 1, 3].map((y, i) => (
          <group key={i} position={[11, y, 0.71]} rotation={[Math.PI / 2, 0, 0]}>
            {/* Main Cone */}
            <mesh>
              <cylinderGeometry args={[1, 1, 0.1, 32]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            {/* Neon Ring */}
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.8, 0.05, 16, 32]} />
              <meshBasicMaterial color="#ff00ff" toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Backing Plate */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[26, 12]} />
          <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
      </group>
      {/* The Screen */}


      {/* 3. Control Panel */}
      {/* Pass the raw video element handling from the texture */}
      <ControlPanel
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        videoElement={texture.image}
      />
    </group >
  );
}

function SpecialThanksBoard() {
  const credits = [
    { name: "DocterGamer", role: "Research" },
    { name: "ZAYZHIK", role: "Research" },
    { name: "NUT-R", role: "Research" },
    { name: "BAM", role: "Research" },
    { name: "Wernjia", role: "Research" }
  ];

  return (
    <group position={[0, 6, 49.8]} rotation={[0, Math.PI, 0]}>
      {/* 1. Main Structure - Metallic Frame */}
      {/* Side Pillars */}
      <mesh position={[-4.1, 0, 0]}>
        <boxGeometry args={[0.2, 5.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[4.1, 0, 0]}>
        <boxGeometry args={[0.2, 5.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Top/Bottom Rails */}
      <mesh position={[0, 2.6, 0]}>
        <boxGeometry args={[8.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -2.6, 0]}>
        <boxGeometry args={[8.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 2. Glass Panel Background */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[8, 5, 0.1]} />
        <meshPhysicalMaterial
          color="#000000"
          metalness={0.6}
          roughness={0.2}
          transmission={0.8} // Glassy look
          thickness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 3. Neon Accents - Vertical Strips */}
      <mesh position={[-3.9, 0, 0.16]}>
        <boxGeometry args={[0.05, 4.8, 0.02]} />
        <meshBasicMaterial color="cyan" toneMapped={false} />
      </mesh>
      <mesh position={[3.9, 0, 0.16]}>
        <boxGeometry args={[0.05, 4.8, 0.02]} />
        <meshBasicMaterial color="cyan" toneMapped={false} />
      </mesh>

      {/* 4. Title Text */}
      <Text
        position={[0, 1.8, 0.2]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        SPECIAL THANKS
      </Text>

      {/* Divider */}
      <mesh position={[0, 1.3, 0.2]}>
        <planeGeometry args={[5, 0.02]} />
        <meshBasicMaterial color="magenta" toneMapped={false} />
      </mesh>

      {/* 5. Names List (Split Columns) */}
      {credits.map((item, i) => (
        <group key={i} position={[0, 0.7 - (i * 0.5), 0.2]}>
          {/* Name (Right Aligned to Center - Padding) */}
          <Text
            position={[-0.2, 0, 0]}
            fontSize={0.28}
            color="#dddddd"
            anchorX="right"
            anchorY="middle"
          >
            {item.name}
          </Text>

          {/* Separator / Dot */}
          <mesh position={[0, 0, 0]}>
            <circleGeometry args={[0.03, 16]} />
            <meshBasicMaterial color="#555" />
          </mesh>

          {/* Role (Left Aligned to Center + Padding) */}
          <Text
            position={[0.2, 0, 0]}
            fontSize={0.28}
            color="#00ffff" // Cyan for role distinction
            anchorX="left"
            anchorY="middle"
          >
            {item.role}
          </Text>
        </group>
      ))}
    </group>
  );
}

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Intro State
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
      <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden' }}>

        {/* WELCOME SCREEN OVERLAY - Always mounted for fade-out logic */}
        <WelcomeScreen started={hasStarted} onEnter={() => setHasStarted(true)} />

        <Canvas camera={{ fov: 40, position: [0, 2, 20] }} shadows gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5, outputColorSpace: THREE.SRGBColorSpace }}>
          {/* 1. Post Processing - The "Cinematic" Look */}
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.5} />
            {/* <Vignette eskil={false} offset={0.1} darkness={1.1} /> */}
          </EffectComposer>

          {/* 2. Environment & Lighting */}
          {/* HDRI for realistic reflections */}
          <Environment preset="city" background={false} blur={0.8} />

          {/* Atmosphere & Background */}
          <color attach="background" args={['#050505']} />
          {/* Fog handled by EnvironmentEnhancements now */}

          <EnvironmentEnhancements />

          {/* Lighting System */}
          <ambientLight intensity={0.2} /> {/* Lower ambient for more contrast */}
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

            {/* Ceiling - Premium Tech Structure */}
            <group position={[0, 15, 0]}>
              {/* 1. Main Ceiling Plate (The "Roof") */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.2} />
              </mesh>

              {/* 2. Structural Grid System */}
              {/* Longitudinal Beams (Z-Axis) */}
              {[-15, -5, 5, 15].map((x, i) => (
                <group key={`c-beam-z-${i}`} position={[x, 0, 0]}>
                  {/* Main Beam Body */}
                  <mesh>
                    <boxGeometry args={[1, 1, 100]} />
                    <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
                  </mesh>
                  {/* Integrated Neon Strip (Bottom face) */}
                  <mesh position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.2, 100]} />
                    <meshBasicMaterial color="white" toneMapped={false} />
                  </mesh>
                </group>
              ))}

              {/* Transverse Beams (X-Axis) */}
              {Array.from({ length: 11 }).map((_, i) => {
                const z = -50 + i * 10;
                return (
                  <group key={`c-beam-x-${i}`} position={[0, 0.2, z]}>
                    <mesh>
                      <boxGeometry args={[50, 0.6, 0.8]} />
                      <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
                    </mesh>
                    {/* Joint Details */}
                    {[-15, -5, 5, 15].map((jx, j) => (
                      <mesh key={j} position={[jx, 0, 0]}>
                        <boxGeometry args={[1.2, 0.8, 1.2]} />
                        <meshStandardMaterial color="#222" metalness={0.9} roughness={0.1} />
                      </mesh>
                    ))}
                  </group>
                );
              })}

              {/* 3. Central Feature Lighting (The "Sky Light" equivalent) */}
              {/* Large Rectangular Light Frames */}
              {[-20, 0, 20].map((zPos, i) => (
                <group key={`light-frame-${i}`} position={[0, -0.2, zPos]}>
                  {/* Frame */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[8, 20]} />
                    <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
                  </mesh>
                  {/* Inner Light */}
                  <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[7, 18]} />
                    <meshBasicMaterial color="#ffffff" toneMapped={false} />
                  </mesh>
                  {/* Light Source */}
                  <pointLight instanceWithoutShadows intensity={1} distance={20} decay={2} color="white" position={[0, -2, 0]} />
                </group>
              ))}
            </group>

            {/* Walls - CYBERPUNK GRID TEXTURE */}
            <mesh position={[-12, 7.5, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[100, 15]} />
              {/* Using wireframe to simulate a grid texture without external assets */}
              <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} wireframe={true} />
              <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[100, 15]} />
                <meshBasicMaterial color="#000" />
              </mesh>
            </mesh>
            <mesh position={[12, 7.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[100, 15]} />
              <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} wireframe={true} />
              <mesh position={[0, 0, -0.1]}>
                <planeGeometry args={[100, 15]} />
                <meshBasicMaterial color="#000" />
              </mesh>
            </mesh>

            {/* Back Wall (Closing the hall) */}
            <mesh position={[0, 7.5, 50]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[24, 15]} />
              <meshStandardMaterial color="#020202" roughness={0.8} />
            </mesh>

            {/* Special Thanks Board */}
            <SpecialThanksBoard />

            {/* End Wall Removed for Stage */}

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




            {/* 6. Anniversary Stage & MV Player */}
            <Stage isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
          </Suspense>

          {/* ONLY ENABLE CONTROLS IF STARTED */}
          {hasStarted && <PointerLockControls />}

        </Canvas>

        {/* UI Overlay (HUD) - ONLY SHOW IF STARTED */}
        {hasStarted && (
          <div style={{
            position: 'absolute', top: 40, left: 40, color: 'white',
            fontFamily: "'Segoe UI', Roboto, sans-serif", pointerEvents: 'none',
            textShadow: '0px 0px 10px rgba(0,255,255,0.5)'
          }}>
            <Reticle />
            <h1 style={{ margin: 0, fontWeight: 300, fontSize: '2.5rem', letterSpacing: '0.2rem', textTransform: 'uppercase' }}>World End</h1>
            <h2 style={{ margin: 0, fontWeight: 600, fontSize: '1rem', color: '#888', letterSpacing: '0.1rem' }}>DIGITAL EXHIBITION</h2>
            <div style={{ marginTop: 20, fontSize: '0.8rem', color: '#666' }}>
              <span style={{ border: '1px solid #444', padding: '5px 10px', borderRadius: 4 }}>WASD to Walk</span>
              <span style={{ marginLeft: 10, border: '1px solid #444', padding: '5px 10px', borderRadius: 4 }}>Click Mouse to Look</span>
              <span style={{ marginLeft: 10, border: '1px solid #444', padding: '5px 10px', borderRadius: 4 }}>Click Stand to Play MV</span>
            </div>
          </div>
        )}
      </div>
    </KeyboardControls>

  );
}
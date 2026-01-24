import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sky, Text, Box, useTexture, KeyboardControls, useKeyboardControls, Environment, Text3D, MeshReflectorMaterial, useVideoTexture } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { EnvironmentEnhancements } from './components/EnvironmentEnhancements';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PortraitCanvas } from './components/PortraitCanvas';
import { useStore } from './store';
import { MobileControls } from './components/MobileControls';


// 1. Player Control with Collision Detection
function Player() {
  const [, getKeys] = useKeyboardControls();
  const speed = 10.0; // Units per second (previously 0.15/frame)
  const playerRadius = 0.5; // Collision radius

  // Store access
  const joystick = useStore(state => state.joystick);
  const joystickLook = useStore(state => state.joystickLook);

  // Define Obstacles (Axis-Aligned Bounding Boxes)
  // x, z = center; w, d = full width/depth
  const obstacles = [
    // Kiosk removed - can walk through it now
    // Left Pillars (x=-10)
    ...[-10, -5, 0, 5, 10].map(z => ({ x: -10, z, w: 1.2, d: 1.2 })),
    // Right Pillars (x=10)
    ...[-10, -5, 0, 5, 10].map(z => ({ x: 10, z, w: 1.2, d: 1.2 })),

    // Character Frames (Floating at x= +/- 8)
    // Size approx: Width (global Z) = 4, Depth (global X) = 0.3
    // Left Frames
    ...[5, 0, -5].map(z => ({ x: -8, z, w: 0.6, d: 4.0 })),
    // Right Frames
    ...[5, 0, -5].map(z => ({ x: 8, z, w: 0.6, d: 4.0 })),
  ];

  const checkCollision = (newPos) => {
    // 1. Hallway Boundaries (Walls)
    // X Limits: -11.5 to 11.5 (Walls at +/- 12)
    if (newPos.x < -11.5 || newPos.x > 11.5) return true;

    // Z Limits: -19 (Stage Front) to 49 (Back Wall)
    // Stage starts approx at Z = -20.5 (Center -28, Depth 15/2 = 7.5)
    if (newPos.z < -19 || newPos.z > 49) return true;

    // 2. Obstacles
    for (let obs of obstacles) {
      // Simple AABB overlap check
      const halfW = obs.w / 2 + playerRadius;
      const halfD = obs.d / 2 + playerRadius;
      if (
        newPos.x > obs.x - halfW &&
        newPos.x < obs.x + halfW &&
        newPos.z > obs.z - halfD &&
        newPos.z < obs.z + halfD
      ) {
        return true;
      }
    }
    return false;
  };

  useFrame((state, delta) => {
    state.camera.rotation.order = 'YXZ'; // Prevent gimbal lock
    const { forward, backward, left, right, sprint } = getKeys();

    // LOOK CONTROL (Mobile)
    if (joystickLook.x || joystickLook.y) {
      const lookSpeed = 2.0 * delta;
      state.camera.rotation.y -= joystickLook.x * lookSpeed;
      state.camera.rotation.x -= joystickLook.y * lookSpeed;
      // Clamp pitch to avoid flipping (approx -85 to +85 degrees)
      state.camera.rotation.x = Math.max(-1.5, Math.min(1.5, state.camera.rotation.x));
    }

    // Calculate Movement Vector
    const currentSpeed = speed * (sprint ? 2.5 : 1.0) * delta;
    const direction = new THREE.Vector3();

    // Joystick Y: Up is negative. We want Forward (-Z) when Up.
    // keys: backward(1) - forward(1). 
    // totalZ = backward - forward + joystick.y
    const fwdInput = Number(backward) - Number(forward) + joystick.y;
    const frontVector = new THREE.Vector3(0, 0, fwdInput);

    // Joystick X: Right is positive.
    // keys: left(1) - right(1).
    // Logic: sideVector is "Leftness". direction = front - side.
    // if side is (1,0,0) [Left], direction is (-1,0,0). Correct.
    // so sideVector should include -joystick.x (Rightness)
    const sideInput = Number(left) - Number(right) - joystick.x;
    const sideVector = new THREE.Vector3(sideInput, 0, 0);

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed)
      .applyEuler(state.camera.rotation);

    // Apply X Movement (Sliding)
    const currentPos = state.camera.position.clone();
    const nextPosX = currentPos.clone().add(new THREE.Vector3(direction.x, 0, 0));

    if (!checkCollision(nextPosX)) {
      state.camera.position.x += direction.x;
    }

    // Apply Z Movement (Sliding)
    const nextPosZ = state.camera.position.clone().add(new THREE.Vector3(0, 0, direction.z));
    // Re-check Z from possibly new X position
    if (!checkCollision(nextPosZ)) {
      state.camera.position.z += direction.z;
    }
  });

  return null;
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

  // ADJUST BRIGHTNESS HERE (0.0 to 1.0)
  // 1.0 = Original Brightness
  // 0.5 = 50% Darker
  // 2.0 = 2x Brighter (might blowout if toneMapped=false)
  const brightness = 0.5; //video brightness

  return (
    <mesh>
      <planeGeometry args={[16, 9]} />
      <meshBasicMaterial
        map={texture}
        // Create a color based on the brightness scalar (white * brightness)
        color={new THREE.Color().setScalar(brightness)}
        toneMapped={false}
      />
    </mesh>
  );
}

// 5. Dynamic Reticle (Cursor)
function Reticle() {
  const [opacity, setOpacity] = useState(0);
  const timeoutRef = useRef(null);
  const hovered = useStore(state => state.hovered);
  const joystickLook = useStore(state => state.joystickLook);
  const joystick = useStore(state => state.joystick);

  React.useEffect(() => {
    const handleAction = () => {
      setOpacity(1);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setOpacity(0), 2000);
    };

    window.addEventListener('mousemove', handleAction);
    // Also trigger on joystick change
    if (joystickLook.x || joystickLook.y || joystick.x || joystick.y) {
      handleAction();
    }

    return () => {
      window.removeEventListener('mousemove', handleAction);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [joystickLook, joystick]);

  // Pulse animation for hover
  const scale = hovered ? 1.5 : 1;
  const color = hovered ? 'cyan' : 'white';
  const shape = hovered ? '0%' : '50%'; // Square when hovered? or just larger circle

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      width: '5px',
      height: '5px',
      border: `1.5px solid ${color}`,
      backgroundColor: hovered ? color : 'white',
      borderRadius: shape,
      transform: `translate(-50%, -50%) scale(${scale})`,
      pointerEvents: 'none',
      opacity: opacity,
      transition: 'all 0.2s ease',
      zIndex: 1000,
      boxShadow: hovered ? '0 0 10px cyan' : '0 0 4px rgba(255, 255, 255, 0.8)'
    }} />
  );
}

function ControlButton({ position, label, onClick, color = "#00ffff", size = 0.15 }) {
  const [hovered, setHoverLocal] = useState(false);
  const setGlobalHover = useStore(state => state.setHover);

  const onOver = () => { setHoverLocal(true); setGlobalHover(true); };
  const onOut = () => { setHoverLocal(false); setGlobalHover(false); };

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={onOver}
        onPointerOut={onOut}
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

// DEBUG: Visualize Collision Boxes
function DebugObstacles() {
  const obstacles = [
    // Kiosk removed - can walk through it now
    ...[-10, -5, 0, 5, 10].map(z => ({ x: -10, z, w: 1.2, d: 1.2 })), // Left Pillars
    ...[-10, -5, 0, 5, 10].map(z => ({ x: 10, z, w: 1.2, d: 1.2 })), // Right Pillars
    ...[5, 0, -5].map(z => ({ x: -8, z, w: 0.6, d: 4.0 })), // Left Frames
    ...[5, 0, -5].map(z => ({ x: 8, z, w: 0.6, d: 4.0 })), // Right Frames
  ];

  // return (
  //   <group>
  //     {obstacles.map((obs, i) => (
  //       <mesh key={i} position={[obs.x, 1, obs.z]}>
  //         <boxGeometry args={[obs.w, 2, obs.d]} />
  //         <meshBasicMaterial color="red" wireframe />
  //       </mesh>
  //     ))}
  //   </group>
  // );
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
        <mesh position={[-8.2, 0, 0]}>
          <boxGeometry args={[0.4, 9.8, 0.5]} />
          <meshStandardMaterial color="#111" metalness={1.0} roughness={0.1} />
        </mesh>

        {/* Right Vertical Frame */}
        <mesh position={[8.2, 0, 0]}>
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
  const [hasStarted, setHasStarted] = useState(false);

  // Simple check similar to mobile controls component
  // Note: better to have a shared hook, but keeping it simple for now
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 1100 || navigator.maxTouchPoints > 0;

  return (
    // 3. ห่อด้วย KeyboardControls เพื่อให้ใช้ WASD ได้
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'sprint', keys: ['Shift'] },
      ]}
    >
      <div style={{ width: '100vw', height: '100vh', background: 'black', overflow: 'hidden' }}>


        {/* WELCOME SCREEN OVERLAY */}
        <WelcomeScreen started={hasStarted} onEnter={() => setHasStarted(true)} />
        {/* MOBILE CONTROLS OVERLAY - Conditional */}
        {hasStarted && isMobile && <MobileControls />}

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

            {/* NEW PORTRAIT FRAMES ON LEFT WALL (SAMPLES) */}
            <PortraitCanvas
              url="./assets/Xonebu.jpg"
              position={[-11.9, 6, 20]}
              rotation={[0, Math.PI / 2, 0]}
              label="SAMPLE ART 03"
              description="CONCEPT / DRAFT"
              neonColor="cyan"
            />
            <PortraitCanvas
              url="./assets/AMI.jpg"
              position={[-11.9, 6, 30]}
              rotation={[0, Math.PI / 2, 0]}
              label="SAMPLE ART 04"
              description="CONCEPT / FINAL"
              neonColor="cyan"
            />

            {/* NEW PORTRAIT FRAMES ON RIGHT WALL (SAMPLES) */}
            <PortraitCanvas
              url="./assets/AMI.jpg"
              position={[11.9, 6, 20]}
              rotation={[0, -Math.PI / 2, 0]}
              label="SAMPLE ART 01"
              description="FANART / V1"
              neonColor="magenta"
            />
            <PortraitCanvas
              url="./assets/Ahyra.jpg"
              position={[11.9, 6, 30]}
              rotation={[0, -Math.PI / 2, 0]}
              label="SAMPLE ART 02"
              description="FANART / V2"
              neonColor="magenta"
            />

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
              <PortraitCanvas url="/assets/Xonebu.jpg" position={[-8, 3.5, 5]} rotation={[0, Math.PI / 2, 0]} label="XONEBU" description="ALIEN / X01" neonColor="cyan" />
            </group>

            <group>
              <spotLight position={[-8, 10, 3]} target-position={[-8, 3, 0]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="cyan" />
              <PortraitCanvas url="/assets/AMI.jpg" position={[-8, 3.5, 0]} rotation={[0, Math.PI / 2, 0]} label="BETA AMI" description="ANDROID / GUARDIAN" neonColor="cyan" />
            </group>

            <group>
              <spotLight position={[-8, 10, -2]} target-position={[-8, 3, -5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="cyan" />
              <PortraitCanvas url="/assets/Ahyra.jpg" position={[-8, 3.5, -5]} rotation={[0, Math.PI / 2, 0]} label="ASHYRA" description="ENERGY / 300%" neonColor="cyan" />
            </group>

            {/* Right Side Characters */}
            <group>
              <spotLight position={[8, 10, 8]} target-position={[8, 3, 5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <PortraitCanvas url="/assets/Debirun.jpg" position={[8, 3.5, 5]} rotation={[0, -Math.PI / 2, 0]} label="DEBIRUN" description="COMMANDER / METEOR" neonColor="magenta" />
            </group>

            <group>
              <spotLight position={[8, 10, 3]} target-position={[8, 3, 0]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <PortraitCanvas url="/assets/Tsururu.jpg" position={[8, 3.5, 0]} rotation={[0, -Math.PI / 2, 0]} label="TSURURU" description="CLOUD / HIGH ALTITUDE" neonColor="magenta" />
            </group>

            <group>
              <spotLight position={[8, 10, -2]} target-position={[8, 3, -5]} angle={0.3} penumbra={0.5} intensity={50} castShadow color="magenta" />
              <PortraitCanvas url="/assets/MildR.jpg" position={[8, 3.5, -5]} rotation={[0, -Math.PI / 2, 0]} label="MILD-R" description="MUTANT / HEALER" neonColor="magenta" />
            </group>




            {/* 6. Anniversary Stage & MV Player */}
            <Stage isPlaying={isPlaying} setIsPlaying={setIsPlaying} />

            {/* DEBUG: Show invisible walls */}
            <DebugObstacles />
          </Suspense>

          {/* ONLY ENABLE CONTROLS IF STARTED & Desktop */}
          {hasStarted && !isMobile && <PointerLockControls />}

        </Canvas>

        {/* UI Overlay (HUD) - ONLY SHOW IF STARTED */}
        {hasStarted && (
          <div style={{
            position: 'absolute', top: 40, left: 40, color: 'white',
            fontFamily: "'Segoe UI', Roboto, sans-serif", pointerEvents: 'none',
            textShadow: '0px 0px 10px rgba(0,255,255,0.5)'
          }}>
            <Reticle />
            <h1 style={{ margin: 0, fontWeight: 300, fontSize: '2rem', letterSpacing: '0.2rem', textTransform: 'uppercase' }}>World End</h1>
            <h2 style={{ margin: 0, fontWeight: 600, fontSize: '0.8rem', color: '#888', letterSpacing: '0.1rem' }}>DIGITAL EXHIBITION</h2>

            {/* Desktop Instructions - Hide on small screens */}
            <div className="desktop-instructions" style={{ marginTop: 20, fontSize: '0.8rem', color: '#666', display: window.innerWidth < 900 ? 'none' : 'block' }}>
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
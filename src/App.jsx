import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointerLockControls, Sky, Text, Box, useTexture, KeyboardControls, useKeyboardControls } from '@react-three/drei';
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
        <Canvas camera={{ fov: 45, position: [0, 2, 15] }} shadows>
          <Sky sunPosition={[10, 10, 10]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} color="#8000ff" />
          <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} castShadow />

          <Suspense fallback={null}>
            <Player />
            
            {/* พื้นนิทรรศการ - ขยายให้กว้างขึ้นและใส่ Grid ช่วยกะระยะ */}
            <gridHelper args={[100, 50, 0x333333, 0x111111]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial color="#050505" />
            </mesh>

            {/* โซนตัวละครต่างๆ */}
            <LoreFrame 
              url="/assets/Xonebu.jpg" // แก้เป็น path จริงของคุณ เช่น /assets/Xonebu.jpg
              position={[-8, 3, -5]} 
              name="Xonebu X’thulhu"
              description="เอเลี่ยนจากดาว X01 เดินทางมาหาอะไรทำแก้เบื่อที่โลก"
            />

            <LoreFrame 
              url="/assets/AMI.jpg" 
              position={[-4, 3, -5]} 
              name="Beta AMI"
              description="หุ่นยนต์ผู้รักมนุษย์ ออกเดินทางเพื่อปกป้อง 'ผู้สร้าง'"
            />

            <LoreFrame 
              url="/assets/Ahyra.jpg" 
              position={[0, 3, -5]} 
              name="T-Reina Ashyra"
              description="สาวน้อยพลังงาน 300% ผู้เป็นศูนย์รวมความสดใส"
            />

            <LoreFrame 
              url="/assets/Debirun.jpg" 
              position={[4, 3, -5]} 
              name="Debirun"
              description="ผู้บัญชาการเมเทโอรอยด์ ย้อนเวลากลับมาเพื่อเตือนชาวโลก"
            />

            <LoreFrame 
              url="/assets/Tsururu.jpg" 
              position={[8, 3, -5]} 
              name="Kumoku Tsururu"
              description="ก้อนเมฆตัวแทนแห่งภาวะโลกร้อนที่ลอยสูงที่สุด"
            />

            {/* Mild-R - Mutant Area */}
            <LoreFrame 
              url="/assets/MildR.jpg" 
              position={[12, 3, -5]} 
              name="Mild-R"
              description="The Healing Mutant: มนุษย์กลายพันธุ์ผู้มีพลังในการรักษา และพร้อมจะเยียวยาหัวใจของทุกคนในโลกหลังวันสิ้นโลก"
            />

            {/* ป้ายครบรอบ */}
            <Text position={[0, 8, -10]} fontSize={1.5} color="#ff0000" fontWeight="bold">
              WORLD END 3rd ANNIVERSARY
            </Text>
          </Suspense>

          <PointerLockControls />
        </Canvas>

        {/* UI Overlay */}
        <div style={{ 
          position: 'absolute', top: 40, left: 40, color: 'white', 
          fontFamily: 'sans-serif', pointerEvents: 'none',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ margin: 0, color: 'cyan' }}>World End: Digital Museum</h1>
          <p>Click to Look Around | WASD to Move</p>
        </div>
      </div>
    </KeyboardControls>
  );
}
// ============================================================
// 3D CONVEYOR SCENE - React Three Fiber
// ============================================================

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../simulation/simulationEngine';

// ── Conveyor Belt ──────────────────────────────────────────
function ConveyorBelt() {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureOffsetRef = useRef(0);
  const conveyorRunning = useSimStore(s => s.conveyorRunning);
  const speed = useSimStore(s => s.speed);
  const paused = useSimStore(s => s.paused);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 32; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#252525' : '#1a1a1a';
      ctx.fillRect(i * 16, 0, 16, 128);
    }
    // Add grip lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < 64; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, 0);
      ctx.lineTo(i * 8, 128);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (conveyorRunning && !paused && texture) {
      textureOffsetRef.current += delta * speed * 0.3;
      texture.offset.x = textureOffsetRef.current;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.52, 0]} receiveShadow>
      <boxGeometry args={[6, 0.08, 1.2]} />
      <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} color="#2a2a2a" />
    </mesh>
  );
}

// ── Conveyor Frame ─────────────────────────────────────────
function ConveyorFrame() {
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#546e7a',
    roughness: 0.3,
    metalness: 0.8,
  }), []);

  return (
    <group>
      {/* Side rails */}
      <mesh position={[0, 0.35, 0.7]} material={frameMaterial} castShadow>
        <boxGeometry args={[6.2, 0.4, 0.08]} />
      </mesh>
      <mesh position={[0, 0.35, -0.7]} material={frameMaterial} castShadow>
        <boxGeometry args={[6.2, 0.4, 0.08]} />
      </mesh>
      {/* Legs */}
      {[-2.5, -0.8, 0.8, 2.5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, 0.65]} material={frameMaterial} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
          </mesh>
          <mesh position={[x, 0, -0.65]} material={frameMaterial} castShadow>
            <boxGeometry args={[0.08, 0.7, 0.08]} />
          </mesh>
          {/* Cross brace */}
          <mesh position={[x, -0.1, 0]} material={frameMaterial}>
            <boxGeometry args={[0.06, 0.06, 1.2]} />
          </mesh>
        </group>
      ))}
      {/* End plates */}
      <mesh position={[-3.1, 0.4, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[0.1, 0.5, 1.5]} />
      </mesh>
      <mesh position={[3.1, 0.4, 0]} material={frameMaterial} castShadow>
        <boxGeometry args={[0.1, 0.5, 1.5]} />
      </mesh>
    </group>
  );
}

// ── Rollers ────────────────────────────────────────────────
function Rollers() {
  const rollersRef = useRef<THREE.Group>(null);
  const conveyorRunning = useSimStore(s => s.conveyorRunning);
  const speed = useSimStore(s => s.speed);
  const paused = useSimStore(s => s.paused);

  useFrame((_, delta) => {
    if (rollersRef.current && conveyorRunning && !paused) {
      rollersRef.current.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z += delta * speed * 3;
        }
      });
    }
  });

  const positions = useMemo(() => {
    const p = [];
    for (let x = -2.8; x <= 2.8; x += 0.4) {
      p.push(x);
    }
    return p;
  }, []);

  return (
    <group ref={rollersRef}>
      {positions.map((x, i) => (
        <mesh key={i} position={[x, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 12]} />
          <meshStandardMaterial color="#607d8b" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// ── Motor Housing ──────────────────────────────────────────
function MotorHousing() {
  const motorEnabled = useSimStore(s => s.motorEnabled);
  
  return (
    <group position={[-3.4, 0.2, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.5, 0.8]} />
        <meshStandardMaterial color="#37474f" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Motor shaft */}
      <mesh position={[0.35, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#78909c" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Status indicator on motor */}
      <mesh position={[0, 0.28, 0.3]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={motorEnabled ? '#00e676' : '#333'}
          emissive={motorEnabled ? '#00e676' : '#000'}
          emissiveIntensity={motorEnabled ? 0.8 : 0}
        />
      </mesh>
      <Text position={[0, 0.28, 0.42]} fontSize={0.06} color="#8888a0" anchorX="center">
        MOTOR
      </Text>
    </group>
  );
}

// ── Product 3D Object ──────────────────────────────────────
function Product3D({ product }: { product: { id: string; position: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const conveyorLength = 6;
  const x = -3 + product.position * conveyorLength;
  
  const color = useMemo(() => {
    const colors = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1'];
    const idx = parseInt(product.id.replace('P', '')) % colors.length;
    return colors[idx];
  }, [product.id]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  if (product.position > 1.05 || product.position < -0.02) return null;

  return (
    <group position={[x, 0.72, 0]}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.3]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      <Text position={[0, 0.25, 0]} fontSize={0.06} color="white" anchorX="center">
        {product.id}
      </Text>
    </group>
  );
}

// ── Sensor 3D ──────────────────────────────────────────────
function Sensor3D({
  position,
  label,
  active,
  type,
}: {
  position: [number, number, number];
  label: string;
  active: boolean;
  type: 'product' | 'position' | 'fault' | 'emergency';
}) {
  const color = active
    ? type === 'emergency' ? '#ff1744'
    : type === 'fault' ? '#ffab00'
    : '#00e676'
    : '#333';

  return (
    <group position={position}>
      {/* Sensor housing */}
      <mesh castShadow>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color="#455a64" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Sensor lens/indicator */}
      <mesh position={[0, 0, 0.09]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1 : 0}
        />
      </mesh>
      {/* Beam (for product/position sensors) */}
      {(type === 'product' || type === 'position') && (
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.3, 4]} />
          <meshBasicMaterial
            color={active ? '#00e676' : '#1b5e20'}
            transparent
            opacity={active ? 0.8 : 0.3}
          />
        </mesh>
      )}
      <Text position={[0, 0.2, 0]} fontSize={0.06} color="#8888a0" anchorX="center">
        {label}
      </Text>
      <Text position={[0, 0.14, 0]} fontSize={0.05} color={active ? color : '#555'} anchorX="center">
        {active ? '1' : '0'}
      </Text>
    </group>
  );
}

// ── Control Cabinet ────────────────────────────────────────
function ControlCabinet() {
  const fsmState = useSimStore(s => s.fsmState);
  const motorEnabled = useSimStore(s => s.motorEnabled);
  const alarmActive = useSimStore(s => s.alarmActive);
  const emergency = useSimStore(s => s.emergency);

  return (
    <group position={[0, 0.8, -1.8]}>
      {/* Cabinet body */}
      <mesh castShadow>
        <boxGeometry args={[2, 1.5, 0.4]} />
        <meshStandardMaterial color="#263238" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0, 0.21]}>
        <boxGeometry args={[1.8, 1.3, 0.02]} />
        <meshStandardMaterial color="#37474f" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Status lights on cabinet */}
      {[
        { label: 'PWR', color: '#00e676', y: 0.5, on: true },
        { label: 'RUN', color: '#00e676', y: 0.25, on: motorEnabled },
        { label: 'FLT', color: '#ffab00', y: 0, on: fsmState === 'FAULT_STOP' },
        { label: 'EMG', color: '#ff1744', y: -0.25, on: emergency },
        { label: 'ALM', color: '#ff1744', y: -0.5, on: alarmActive },
      ].map((light, i) => (
        <group key={i} position={[0.7, light.y, 0.23]}>
          <mesh>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial
              color={light.on ? light.color : '#222'}
              emissive={light.on ? light.color : '#000'}
              emissiveIntensity={light.on ? 0.8 : 0}
            />
          </mesh>
          <Text position={[0.12, 0, 0]} fontSize={0.04} color="#78909c" anchorX="left">
            {light.label}
          </Text>
        </group>
      ))}
      {/* Label */}
      <Text position={[0, 0.85, 0.22]} fontSize={0.06} color="#78909c" anchorX="center" fontWeight={700}>
        CONTROL UNIT
      </Text>
    </group>
  );
}

// ── Emergency Button 3D ────────────────────────────────────
function EmergencyButton3D() {
  const emergency = useSimStore(s => s.emergency);

  return (
    <group position={[2.5, 0.9, -1.2]}>
      {/* Button base */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.18, 0.08, 24]} />
        <meshStandardMaterial color="#b71c1c" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Button top */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 24]} />
        <meshStandardMaterial
          color={emergency ? '#ff1744' : '#d32f2f'}
          emissive={emergency ? '#ff1744' : '#000'}
          emissiveIntensity={emergency ? 1 : 0}
        />
      </mesh>
      <Text position={[0, 0.2, 0]} fontSize={0.05} color="#ff8a80" anchorX="center" fontWeight={700}>
        E-STOP
      </Text>
    </group>
  );
}

// ── Signal Lights (Tower) ──────────────────────────────────
function SignalTower() {
  const motorEnabled = useSimStore(s => s.motorEnabled);
  const fault = useSimStore(s => s.fault);
  const emergency = useSimStore(s => s.emergency);

  const lights = [
    { color: '#00e676', on: motorEnabled && !fault && !emergency, y: 0.3 },
    { color: '#ffab00', on: fault, y: 0 },
    { color: '#ff1744', on: emergency, y: -0.3 },
  ];

  return (
    <group position={[3.5, 1.2, -0.5]}>
      {/* Pole */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
        <meshStandardMaterial color="#78909c" metalness={0.8} roughness={0.3} />
      </mesh>
      {lights.map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial
            color={l.on ? l.color : '#222'}
            emissive={l.on ? l.color : '#000'}
            emissiveIntensity={l.on ? 0.6 : 0}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Safety Zone ────────────────────────────────────────────
function SafetyZone() {
  return (
    <group>
      {/* Floor markers */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.5, 2.5]} />
          <meshStandardMaterial
            color="#1a1a1a"
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
      {/* Warning stripes at edges */}
      {[-3.3, 3.3].map((x, i) => (
        <mesh key={i} position={[x, -0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.2, 2.5]} />
          <meshStandardMaterial color="#ffab00" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ── Ground ─────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0d0d12" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

// ── Main 3D Scene ──────────────────────────────────────────
function Scene() {
  const products = useSimStore(s => s.products);
  const productSensor = useSimStore(s => s.productSensor);
  const positionSensor = useSimStore(s => s.positionSensor);
  const fault = useSimStore(s => s.fault);
  const emergency = useSimStore(s => s.emergency);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 3, 2]} intensity={0.3} color="#448aff" />
      <pointLight position={[4, 3, -2]} intensity={0.2} color="#00e5ff" />

      <Ground />
      <SafetyZone />
      <ConveyorBelt />
      <ConveyorFrame />
      <Rollers />
      <MotorHousing />
      <ControlCabinet />
      <EmergencyButton3D />
      <SignalTower />

      {/* Product Sensor at ~10% of conveyor */}
      <Sensor3D
        position={[-2.4, 0.75, 0.85]}
        label="PRODUCT"
        active={productSensor}
        type="product"
      />
      {/* Position Sensor at ~75% of conveyor */}
      <Sensor3D
        position={[1.5, 0.75, 0.85]}
        label="POSITION"
        active={positionSensor}
        type="position"
      />
      {/* Fault Indicator */}
      <Sensor3D
        position={[-1, 0.9, -1.2]}
        label="FAULT"
        active={fault}
        type="fault"
      />

      {/* Products */}
      {products.map(p => (
        <Product3D key={p.id} product={p} />
      ))}

      <ContactShadows
        position={[0, -0.34, 0]}
        opacity={0.4}
        scale={15}
        blur={2}
        far={4}
      />
    </>
  );
}

// ── Exported Canvas Component ──────────────────────────────
export default function Conveyor3DScene({
  onResetView,
  controlsRef,
}: {
  onResetView?: () => void;
  controlsRef?: React.RefObject<any>;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 4, 5], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0a0f' }}
      dpr={[1, 2]}
    >
      <Scene />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1}
      />
    </Canvas>
  );
}

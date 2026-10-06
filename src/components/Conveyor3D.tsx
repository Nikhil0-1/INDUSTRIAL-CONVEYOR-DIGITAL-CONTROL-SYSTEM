// ============================================================
// 3D CONVEYOR DIGITAL TWIN - HIGH VISIBILITY INDUSTRIAL SCENE
// React Three Fiber + Three.js
// ============================================================

import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { useSimStore } from '../simulation/simulationEngine';
import { Camera, Eye, RotateCw } from 'lucide-react';

// ── Conveyor Belt ──────────────────────────────────────────
function ConveyorBelt() {
  const textureOffsetRef = useRef(0);
  const conveyorRunning = useSimStore(s => s.conveyorRunning);
  const speed = useSimStore(s => s.speed);
  const paused = useSimStore(s => s.paused);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    // Belt base color (clean slate charcoal)
    ctx.fillStyle = '#242b35';
    ctx.fillRect(0, 0, 512, 128);

    // Tread slats
    for (let i = 0; i < 32; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2d3748' : '#1e2530';
      ctx.fillRect(i * 16, 0, 16, 128);
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(i * 16 + 14, 0, 2, 128);
    }

    // Safety edge stripes (bright yellow/black chevron on edges)
    ctx.fillStyle = '#eab308';
    ctx.fillRect(0, 0, 512, 8);
    ctx.fillRect(0, 120, 512, 8);
    
    // Dashed center tracking line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 64);
    ctx.lineTo(512, 64);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (conveyorRunning && !paused && texture) {
      textureOffsetRef.current += delta * speed * 0.35;
      texture.offset.x = textureOffsetRef.current;
    }
  });

  return (
    <mesh position={[0, 0.52, 0]} receiveShadow>
      <boxGeometry args={[6.2, 0.08, 1.25]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  );
}

// ── Conveyor Frame ─────────────────────────────────────────
function ConveyorFrame() {
  // Vibrant brushed anodized aluminum / industrial steel
  const steelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.25,
    metalness: 0.75,
  }), []);

  const yellowMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#eab308',
    roughness: 0.3,
    metalness: 0.4,
  }), []);

  return (
    <group>
      {/* Side structural guard rails (High visibility bright industrial steel) */}
      <mesh position={[0, 0.45, 0.72]} material={steelMaterial} castShadow>
        <boxGeometry args={[6.4, 0.25, 0.08]} />
      </mesh>
      <mesh position={[0, 0.45, -0.72]} material={steelMaterial} castShadow>
        <boxGeometry args={[6.4, 0.25, 0.08]} />
      </mesh>

      {/* Yellow safety guide trims on top */}
      <mesh position={[0, 0.58, 0.72]} material={yellowMaterial}>
        <boxGeometry args={[6.4, 0.04, 0.04]} />
      </mesh>
      <mesh position={[0, 0.58, -0.72]} material={yellowMaterial}>
        <boxGeometry args={[6.4, 0.04, 0.04]} />
      </mesh>

      {/* Main Structural Bed Frame */}
      <mesh position={[0, 0.35, 0]} material={steelMaterial} castShadow>
        <boxGeometry args={[6.3, 0.15, 1.35]} />
      </mesh>

      {/* Support Legs */}
      {[-2.6, -0.9, 0.9, 2.6].map((x, i) => (
        <group key={i}>
          {/* Front vertical leg */}
          <mesh position={[x, 0.05, 0.65]} material={steelMaterial} castShadow>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
          </mesh>
          {/* Rear vertical leg */}
          <mesh position={[x, 0.05, -0.65]} material={steelMaterial} castShadow>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
          </mesh>
          {/* Horizontal cross brace */}
          <mesh position={[x, -0.15, 0]} material={steelMaterial}>
            <boxGeometry args={[0.08, 0.08, 1.2]} />
          </mesh>
          {/* Adjustable foot pads (Rubber / Brass) */}
          <mesh position={[x, -0.32, 0.65]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[x, -0.32, -0.65]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Belt Pulley End Cylinders */}
      <mesh position={[-3.1, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.28, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[3.1, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.28, 24]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.15} />
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
          child.rotation.z += delta * speed * 4;
        }
      });
    }
  });

  const positions = useMemo(() => {
    const p = [];
    for (let x = -2.7; x <= 2.7; x += 0.45) {
      p.push(x);
    }
    return p;
  }, []);

  return (
    <group ref={rollersRef}>
      {positions.map((x, i) => (
        <mesh key={i} position={[x, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.26, 16]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ── Industrial Motor Housing ───────────────────────────────
function MotorHousing() {
  const motorEnabled = useSimStore(s => s.motorEnabled);
  const fanRef = useRef<THREE.Mesh>(null);
  const speed = useSimStore(s => s.speed);

  useFrame((_, delta) => {
    if (fanRef.current && motorEnabled) {
      fanRef.current.rotation.x += delta * speed * 12;
    }
  });

  return (
    <group position={[-3.6, 0.35, 0]}>
      {/* Heavy AC Induction Motor Body (Industrial Cyan/Teal) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.7, 24]} />
        <meshStandardMaterial color="#0284c7" roughness={0.35} metalness={0.65} />
      </mesh>

      {/* Cooling fins */}
      {[-0.2, -0.1, 0, 0.1, 0.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.29, 0.29, 0.02, 24]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}

      {/* Motor Terminal Junction Box */}
      <mesh position={[0.22, 0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.18, 0.22]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Drive Shaft Coupler */}
      <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.25, 16]} />
        <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Motor Cooling Fan Guard */}
      <mesh ref={fanRef} position={[-0.37, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.05, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Motor Status Pilot LED */}
      <mesh position={[0.25, 0.23, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial
          color={motorEnabled ? '#22c55e' : '#475569'}
          emissive={motorEnabled ? '#22c55e' : '#000'}
          emissiveIntensity={motorEnabled ? 2.5 : 0}
        />
      </mesh>

      {/* High-visibility 3D Label */}
      <group position={[0, 0.45, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <Text position={[0, 0, 0.03]} fontSize={0.1} color={motorEnabled ? '#38bdf8' : '#94a3b8'} anchorX="center" fontWeight={700}>
          DRIVE MOTOR
        </Text>
      </group>
    </group>
  );
}

// ── High-Visibility Product 3D ─────────────────────────────
function Product3D({ product }: { product: { id: string; position: number } }) {
  const conveyorLength = 6.2;
  const x = -3.1 + product.position * conveyorLength;

  // Vibrant, high-contrast box colors
  const color = useMemo(() => {
    const colors = ['#f97316', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#eab308'];
    const idx = parseInt(product.id.replace('P', '')) % colors.length;
    return colors[idx];
  }, [product.id]);

  if (product.position > 1.05 || product.position < -0.02) return null;

  return (
    <group position={[x, 0.72, 0]}>
      {/* Cardboard/Composite Package */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.32, 0.38]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Package Tape Strip */}
      <mesh position={[0, 0.165, 0]}>
        <boxGeometry args={[0.4, 0.01, 0.1]} />
        <meshStandardMaterial color="#fef08a" roughness={0.6} />
      </mesh>

      {/* High-Contrast Product ID Tag Badge */}
      <group position={[0, 0.28, 0]}>
        <mesh>
          <boxGeometry args={[0.36, 0.14, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.09} color="#ffffff" anchorX="center" fontWeight={800}>
          {product.id}
        </Text>
      </group>
    </group>
  );
}

// ── High-Visibility Optical / Proximity Sensor ─────────────
function Sensor3D({
  position,
  label,
  active,
  type,
}: {
  position: [number, number, number];
  label: string;
  active: boolean;
  type: 'product' | 'position' | 'fault';
}) {
  const activeColor = type === 'fault' ? '#ef4444' : type === 'position' ? '#38bdf8' : '#22c55e';
  const inactiveColor = '#475569';

  return (
    <group position={position}>
      {/* Sensor Post Mount (Vertical Steel Pillar) */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Sensor Main Enclosure */}
      <mesh castShadow>
        <boxGeometry args={[0.22, 0.26, 0.22]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Laser Lens Aperture */}
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial
          color={active ? activeColor : '#0f172a'}
          emissive={active ? activeColor : '#000'}
          emissiveIntensity={active ? 2.5 : 0}
        />
      </mesh>

      {/* Active Infrared / Optical Detection Beam Across Belt */}
      <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.2, 8]} />
        <meshBasicMaterial
          color={active ? activeColor : '#334155'}
          transparent
          opacity={active ? 0.95 : 0.35}
        />
      </mesh>

      {/* Top Signaling Dome Light */}
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={active ? activeColor : inactiveColor}
          emissive={active ? activeColor : '#000'}
          emissiveIntensity={active ? 2.5 : 0}
        />
      </mesh>

      {/* Floating High-Contrast HUD Label Badge */}
      <group position={[0, 0.38, 0]}>
        {/* Badge Background Card */}
        <mesh>
          <boxGeometry args={[0.9, 0.24, 0.02]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.11, 0.01]}>
          <boxGeometry args={[0.9, 0.03, 0.02]} />
          <meshStandardMaterial color={active ? activeColor : '#334155'} />
        </mesh>
        <Text position={[0, 0.03, 0.02]} fontSize={0.09} color="#f8fafc" anchorX="center" fontWeight={800}>
          {label}
        </Text>
        <Text position={[0, -0.06, 0.02]} fontSize={0.08} color={active ? activeColor : '#64748b'} anchorX="center" fontWeight={700}>
          STATE: {active ? 'ACTIVE [1]' : 'IDLE [0]'}
        </Text>
      </group>
    </group>
  );
}

// ── Control Cabinet & HMI Screen ───────────────────────────
function ControlCabinet() {
  const fsmState = useSimStore(s => s.fsmState);
  const motorEnabled = useSimStore(s => s.motorEnabled);
  const alarmActive = useSimStore(s => s.alarmActive);
  const emergency = useSimStore(s => s.emergency);
  const productCount = useSimStore(s => s.productCount);

  return (
    <group position={[0, 0.95, -2.1]}>
      {/* Heavy Rittal Industrial Cabinet */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.8, 0.5]} />
        <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.65} />
      </mesh>

      {/* Front Door Bezel */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[2.3, 1.6, 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Glowing Central HMI Digital Display */}
      <group position={[-0.4, 0.2, 0.29]}>
        <mesh>
          <boxGeometry args={[1.2, 0.75, 0.02]} />
          <meshBasicMaterial color="#020617" />
        </mesh>
        <Text position={[0, 0.22, 0.02]} fontSize={0.07} color="#38bdf8" anchorX="center" fontWeight={700}>
          PLC INDUSTRIAL CONTROLLER
        </Text>
        <Text position={[0, 0.05, 0.02]} fontSize={0.11} color="#22c55e" anchorX="center" fontWeight={800}>
          FSM: {fsmState}
        </Text>
        <Text position={[0, -0.15, 0.02]} fontSize={0.08} color="#94a3b8" anchorX="center" fontWeight={600}>
          TOTAL PACKAGES: {productCount}
        </Text>
      </group>

      {/* Cabinet Warning & Status Pilot Lamps */}
      {[
        { label: 'POWER', color: '#22c55e', y: 0.55, on: true },
        { label: 'MOTOR', color: '#38bdf8', y: 0.3, on: motorEnabled },
        { label: 'ALARM', color: '#f59e0b', y: 0.05, on: alarmActive },
        { label: 'E-STOP', color: '#ef4444', y: -0.2, on: emergency },
      ].map((light, i) => (
        <group key={i} position={[0.7, light.y, 0.29]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
            <meshStandardMaterial
              color={light.on ? light.color : '#0f172a'}
              emissive={light.on ? light.color : '#000'}
              emissiveIntensity={light.on ? 2.5 : 0}
            />
          </mesh>
          <Text position={[0.15, 0, 0.02]} fontSize={0.07} color="#cbd5e1" anchorX="left" fontWeight={700}>
            {light.label}
          </Text>
        </group>
      ))}

      {/* Cabinet Title Header */}
      <Text position={[0, 1.05, 0.28]} fontSize={0.11} color="#f8fafc" anchorX="center" fontWeight={800}>
        CENTRAL LOGIC & DRIVE CABINET
      </Text>
    </group>
  );
}

// ── Physical Emergency Stop Button Pillar ──────────────────
function EmergencyButton3D() {
  const emergency = useSimStore(s => s.emergency);

  return (
    <group position={[2.8, 0.8, -1.3]}>
      {/* Heavy Steel Pedestal */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.1, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Yellow Safety Switch Box */}
      <mesh castShadow>
        <boxGeometry args={[0.34, 0.38, 0.24]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.3} />
      </mesh>

      {/* Red Mushroom E-Stop Head */}
      <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.1, 24]} />
        <meshStandardMaterial
          color={emergency ? '#ff1744' : '#dc2626'}
          emissive={emergency ? '#ff1744' : '#7f1d1d'}
          emissiveIntensity={emergency ? 3.0 : 0.4}
        />
      </mesh>

      {/* Overhead High-Contrast Badge */}
      <group position={[0, 0.35, 0]}>
        <mesh>
          <boxGeometry args={[0.8, 0.2, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <Text position={[0, 0, 0.02]} fontSize={0.09} color={emergency ? '#ef4444' : '#f8fafc'} anchorX="center" fontWeight={800}>
          E-STOP SWITCH
        </Text>
      </group>
    </group>
  );
}

// ── Industrial Stack Light Tower ───────────────────────────
function SignalTower() {
  const motorEnabled = useSimStore(s => s.motorEnabled);
  const fault = useSimStore(s => s.fault);
  const emergency = useSimStore(s => s.emergency);

  const lights = [
    { color: '#ef4444', on: emergency, y: 0.35 },
    { color: '#f59e0b', on: fault, y: 0.12 },
    { color: '#22c55e', on: motorEnabled && !fault && !emergency, y: -0.11 },
  ];

  return (
    <group position={[3.6, 1.35, -0.6]}>
      {/* Stainless Tower Mast */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Stack Lens Cylinders */}
      {lights.map((l, i) => (
        <mesh key={i} position={[0, l.y, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.2, 20]} />
          <meshStandardMaterial
            color={l.on ? l.color : '#1e293b'}
            emissive={l.on ? l.color : '#000'}
            emissiveIntensity={l.on ? 2.5 : 0}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* Audible Alarm Buzzer on top */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.12, 16]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// ── Factory Floor & Safety Boundary Markings ───────────────
function FactoryFloor() {
  return (
    <group position={[0, -0.35, 0]}>
      {/* Clean Slate Industrial Epoxy Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Safety Workcell Border (Bright Yellow Hazard Striping) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8.4, 3.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Yellow Safety Perimeter Frame Lines */}
      {[-4.1, 4.1].map((x, i) => (
        <mesh key={`px-${i}`} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 3.6]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      ))}
      {[-1.75, 1.75].map((z, i) => (
        <mesh key={`pz-${i}`} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.4, 0.16]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      ))}

      {/* High-tech CAD Factory Grid */}
      <gridHelper args={[24, 24, '#38bdf8', '#334155']} position={[0, 0.02, 0]} />
    </group>
  );
}

// ── Camera Controller Helper ───────────────────────────────
function CameraRig({ view }: { view: 'ISOMETRIC' | 'FRONT' | 'TOP' | 'SIDE' }) {
  const { camera } = useThree();

  useFrame(() => {
    let targetPos = new THREE.Vector3(0, 3.5, 6.5);
    if (view === 'FRONT') targetPos = new THREE.Vector3(0, 2.0, 5.5);
    else if (view === 'TOP') targetPos = new THREE.Vector3(0, 8.5, 0.1);
    else if (view === 'SIDE') targetPos = new THREE.Vector3(-6.5, 2.2, 0);

    camera.position.lerp(targetPos, 0.08);
    camera.lookAt(0, 0.5, 0);
  });

  return null;
}

// ── Complete 3D Scene Assembly ─────────────────────────────
function Scene({ cameraView }: { cameraView: 'ISOMETRIC' | 'FRONT' | 'TOP' | 'SIDE' }) {
  const products = useSimStore(s => s.products);
  const productSensor = useSimStore(s => s.productSensor);
  const positionSensor = useSimStore(s => s.positionSensor);
  const fault = useSimStore(s => s.fault);

  return (
    <>
      <CameraRig view={cameraView} />

      {/* ── HIGH VISIBILITY STUDIO LIGHTING RIG ── */}
      {/* High ambient baseline light: eliminates all pitch-black areas */}
      <ambientLight intensity={1.6} color="#f8fafc" />

      {/* Daylight / Ground Bounce Light */}
      <hemisphereLight
        args={['#e0f2fe', '#334155', 1.4]}
      />

      {/* Primary Key Sunlight */}
      <directionalLight
        position={[6, 12, 8]}
        intensity={3.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Secondary Fill Light from Rear Left */}
      <directionalLight
        position={[-8, 9, -6]}
        intensity={2.2}
        color="#bae6fd"
      />

      {/* Conveyor Top Spotlight for Crystal-Clear Product Tracking */}
      <pointLight position={[0, 4.5, 2]} intensity={2.5} distance={16} color="#ffffff" />
      <pointLight position={[-2.4, 2.5, 1]} intensity={1.8} distance={8} color="#38bdf8" />
      <pointLight position={[1.5, 2.5, 1]} intensity={1.8} distance={8} color="#4ade80" />

      {/* Scene Elements */}
      <FactoryFloor />
      <ConveyorBelt />
      <ConveyorFrame />
      <Rollers />
      <MotorHousing />
      <ControlCabinet />
      <EmergencyButton3D />
      <SignalTower />

      {/* Product Sensor at ~10% Conveyor Length */}
      <Sensor3D
        position={[-2.4, 0.85, 0.82]}
        label="PRODUCT SENSOR"
        active={productSensor}
        type="product"
      />

      {/* Position Sensor at ~75% Conveyor Length */}
      <Sensor3D
        position={[1.5, 0.85, 0.82]}
        label="POSITION SENSOR"
        active={positionSensor}
        type="position"
      />

      {/* Products on Belt */}
      {products.map(p => (
        <Product3D key={p.id} product={p} />
      ))}

      {/* Contact Ground Shadows */}
      <ContactShadows
        position={[0, -0.34, 0]}
        opacity={0.6}
        scale={18}
        blur={1.8}
        far={6}
      />
    </>
  );
}

// ── Exported Canvas Component ──────────────────────────────
export default function Conveyor3DScene() {
  const [cameraView, setCameraView] = useState<'ISOMETRIC' | 'FRONT' | 'TOP' | 'SIDE'>('ISOMETRIC');
  const controlsRef = useRef<any>(null);

  const resetCamera = (view: 'ISOMETRIC' | 'FRONT' | 'TOP' | 'SIDE') => {
    setCameraView(view);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.5, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full select-none bg-[#0b1120]">
      {/* ── CAMERA VIEW CONTROLS TOOLBAR ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 glass-panel p-1.5 border border-slate-700/60 shadow-xl bg-slate-900/85">
        <span className="text-[10px] text-slate-400 font-mono px-1.5 flex items-center gap-1">
          <Camera size={12} className="text-cyan-400" /> VIEW:
        </span>
        {(['ISOMETRIC', 'FRONT', 'TOP', 'SIDE'] as const).map(v => (
          <button
            key={v}
            onClick={() => resetCamera(v)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              cameraView === v
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            {v}
          </button>
        ))}
        <button
          onClick={() => resetCamera('ISOMETRIC')}
          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors ml-1"
          title="Reset Orbit Camera"
        >
          <RotateCw size={12} />
        </button>
      </div>

      {/* ── THREE.JS CANVAS ── */}
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 6.5], fov: 48 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25 }}
        style={{ background: '#0b1120', width: '100%', height: '100%' }}
        dpr={[1, 2]}
      >
        <Scene cameraView={cameraView} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}

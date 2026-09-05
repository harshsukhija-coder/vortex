import React, { Suspense, useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import * as THREE from "three";

import CanvasLoader from "../layout/Loader";

// ─── RGB cycling color ────────────────────────────────────────────────────────
const rgbCycle = (t: number, offset = 0) =>
  new THREE.Color().setHSL(((t * 0.18 + offset) % 1 + 1) % 1, 1, 0.55);

// ─── Neon floor ───────────────────────────────────────────────────────────────
const NeonFloor = () => {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.emissive = rgbCycle(clock.getElapsedTime(), 0.6);
      mat.current.emissiveIntensity = 0.05 + Math.sin(clock.getElapsedTime() * 1.5) * 0.025;
    }
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.22, 0]} receiveShadow>
      <planeGeometry args={[9, 6]} />
      <meshStandardMaterial ref={mat} color="#080815" roughness={0.08} metalness={0.95} />
    </mesh>
  );
};

// ─── Room shell ───────────────────────────────────────────────────────────────
const RoomShell = () => (
  <group>
    <mesh position={[0, 0.5, -2.95]} receiveShadow>
      <boxGeometry args={[9, 5, 0.07]} />
      <meshStandardMaterial color="#07071a" roughness={0.95} />
    </mesh>
    <mesh position={[-4.5, 0.5, -0.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
      <boxGeometry args={[6, 5, 0.07]} />
      <meshStandardMaterial color="#09091c" roughness={0.95} />
    </mesh>
    <mesh position={[4.5, 0.5, -0.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
      <boxGeometry args={[6, 5, 0.07]} />
      <meshStandardMaterial color="#09091c" roughness={0.95} />
    </mesh>
    <mesh position={[0, 2.3, -0.5]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <boxGeometry args={[9, 6, 0.07]} />
      <meshStandardMaterial color="#060612" roughness={0.98} />
    </mesh>
  </group>
);

// ─── RGB wall strips ──────────────────────────────────────────────────────────
const RGBStrip: React.FC<{
  position: [number, number, number];
  axis?: "x" | "z";
  length?: number;
  phase?: number;
}> = ({ position, axis = "x", length = 8, phase = 0 }) => {
  const mat   = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const c = rgbCycle(clock.getElapsedTime(), phase);
    if (mat.current)   mat.current.color   = c;
    if (light.current) light.current.color = c;
  });
  const size: [number, number, number] = axis === "x" ? [length, 0.03, 0.03] : [0.03, 0.03, length];
  return (
    <group position={position}>
      <mesh><boxGeometry args={size} /><meshBasicMaterial ref={mat} color="#ff0000" /></mesh>
      <pointLight ref={light} intensity={1.2} distance={2.5} color="#ff0000" />
    </group>
  );
};

// ─── Big TV on back wall ──────────────────────────────────────────────────────
const BigTV = () => {
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (screenMat.current) {
      // Simulate fast gameplay flashing
      const flash = 0.5 + 0.5 * Math.abs(Math.sin(t * 4.5 + 0.3));
      const r = 0.02 + 0.08  * Math.abs(Math.sin(t * 3.1));
      const g = 0.06 + 0.12  * Math.abs(Math.sin(t * 2.3 + 1.2));
      const b = 0.18 + 0.15  * Math.abs(Math.sin(t * 1.9 + 0.7));
      screenMat.current.color.setRGB(r * flash, g * flash, b * flash);
    }
    if (glowLight.current) {
      const t2 = clock.getElapsedTime();
      glowLight.current.color = rgbCycle(t2 * 0.5, 0.1);
      glowLight.current.intensity = 3.0 + Math.sin(t2 * 4.5) * 0.8;
    }
  });
  return (
    <group position={[-1.2, 0.28, -2.88]}>
      {/* TV mount bracket */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.12, 1.1, 0.06]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Bezel */}
      <mesh castShadow>
        <boxGeometry args={[2.6, 1.55, 0.1]} />
        <meshStandardMaterial color="#0a0a18" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[2.46, 1.41, 0.01]} />
        <meshBasicMaterial ref={screenMat} color="#001133" />
      </mesh>
      {/* Scanlines */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, -0.6 + i * 0.13, 0.062]}>
          <boxGeometry args={[2.44, 0.01, 0.003]} />
          <meshBasicMaterial color="#002266" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      {/* Screen glow light */}
      <pointLight ref={glowLight} position={[0, 0, 0.3]} intensity={3.5} distance={3.5} color="#2244ff" />
      {/* TV brand LED (bottom center) */}
      <mesh position={[0, -0.72, 0.055]}>
        <boxGeometry args={[0.18, 0.018, 0.01]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

// ─── PS5 Console beside TV ────────────────────────────────────────────────────
const PS5Console = () => {
  const ledMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (ledMat.current) {
      const t = clock.getElapsedTime();
      ledMat.current.opacity = 0.7 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <group position={[1.42, -0.88, -2.72]}>
      {/* Media stand */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[0.38, 0.22, 0.28]} />
        <meshStandardMaterial color="#0d0d20" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* PS5 black core */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.12, 0.55, 0.22]} />
        <meshStandardMaterial color="#080810" roughness={0.1} metalness={0.95} />
      </mesh>
      {/* Left white wing */}
      <mesh position={[-0.08, 0.21, 0.005]} rotation={[0.015, 0, 0.04]}>
        <boxGeometry args={[0.02, 0.58, 0.25]} />
        <meshStandardMaterial color="#e2e2e2" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Right white wing */}
      <mesh position={[0.08, 0.21, 0.005]} rotation={[-0.015, 0, -0.04]}>
        <boxGeometry args={[0.02, 0.58, 0.25]} />
        <meshStandardMaterial color="#e2e2e2" roughness={0.4} metalness={0.15} />
      </mesh>
      {/* LED strip */}
      <mesh position={[0, 0.22, 0.09]}>
        <boxGeometry args={[0.006, 0.5, 0.006]} />
        <meshBasicMaterial ref={ledMat} color="#00f0ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[0, 0.3, 0.1]} intensity={1.8} distance={0.8} color="#00f0ff" />
    </group>
  );
};

// ─── Couch ────────────────────────────────────────────────────────────────────
const Couch = () => (
  <group position={[-0.6, -0.93, 0.38]}>
    {/* Seat cushion */}
    <mesh position={[0, 0, 0]} receiveShadow castShadow>
      <boxGeometry args={[1.7, 0.16, 0.68]} />
      <meshStandardMaterial color="#1a0535" roughness={0.85} metalness={0.1} />
    </mesh>
    {/* Seat cushion divider */}
    <mesh position={[0, 0.06, 0]}>
      <boxGeometry args={[0.02, 0.06, 0.66]} />
      <meshStandardMaterial color="#120025" roughness={0.9} />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.38, -0.28]} receiveShadow castShadow>
      <boxGeometry args={[1.7, 0.62, 0.16]} />
      <meshStandardMaterial color="#1a0535" roughness={0.85} metalness={0.1} />
    </mesh>
    {/* Backrest accent stripe */}
    <mesh position={[0, 0.38, -0.19]}>
      <boxGeometry args={[1.68, 0.04, 0.01]} />
      <meshBasicMaterial color="#bf61ff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
    </mesh>
    {/* Left armrest */}
    <mesh position={[-0.9, 0.22, -0.06]} castShadow>
      <boxGeometry args={[0.16, 0.42, 0.68]} />
      <meshStandardMaterial color="#15022b" roughness={0.8} metalness={0.15} />
    </mesh>
    {/* Right armrest */}
    <mesh position={[0.9, 0.22, -0.06]} castShadow>
      <boxGeometry args={[0.16, 0.42, 0.68]} />
      <meshStandardMaterial color="#15022b" roughness={0.8} metalness={0.15} />
    </mesh>
    {/* Couch legs */}
    {([-0.72, 0.72] as number[]).map((x) =>
      ([-0.28, 0.28] as number[]).map((z) => (
        <mesh key={`${x}${z}`} position={[x, -0.15, z]} castShadow>
          <boxGeometry args={[0.07, 0.16, 0.07]} />
          <meshStandardMaterial color="#0d0018" roughness={0.4} metalness={0.7} />
        </mesh>
      ))
    )}
  </group>
);



// ─── Gaming desk (right side) ─────────────────────────────────────────────────
const Desk = () => (
  <group position={[3.0, -0.5, -1.2]}>
    <mesh receiveShadow castShadow>
      <boxGeometry args={[1.8, 0.07, 0.85]} />
      <meshStandardMaterial color="#1a0a2e" roughness={0.4} metalness={0.6} />
    </mesh>
    {/* Edge LED */}
    <mesh position={[0, 0.03, 0.43]}>
      <boxGeometry args={[1.8, 0.012, 0.012]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
    </mesh>
    {/* Legs */}
    {([-0.8, 0.8] as number[]).map((x) =>
      ([-0.35, 0.35] as number[]).map((z) => (
        <mesh key={`${x}${z}`} position={[x, -0.42, z]} castShadow>
          <boxGeometry args={[0.06, 0.78, 0.06]} />
          <meshStandardMaterial color="#111122" roughness={0.3} metalness={0.85} />
        </mesh>
      ))
    )}
  </group>
);

// ─── Monitor on desk ──────────────────────────────────────────────────────────
const DeskMonitor = () => {
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (screenMat.current) {
      const t = clock.getElapsedTime();
      screenMat.current.color.setRGB(
        0.02 + 0.02 * Math.sin(t * 5.1),
        0.04 + 0.08 * Math.abs(Math.sin(t * 2.3)),
        0.18 + 0.1  * Math.sin(t * 3.7)
      );
    }
  });
  return (
    <group position={[3.0, 0.12, -1.88]}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.56, 0.05]} />
        <meshStandardMaterial color="#0d0d1a" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[0.83, 0.49, 0.008]} />
        <meshBasicMaterial ref={screenMat} color="#001133" />
      </mesh>
      <pointLight position={[0, 0, 0.12]} intensity={1.5} distance={1.2} color="#0055ff" />
      {/* Stand */}
      <mesh position={[0, -0.35, -0.02]}>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <meshStandardMaterial color="#111120" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.42, -0.02]}>
        <boxGeometry args={[0.3, 0.025, 0.18]} />
        <meshStandardMaterial color="#111120" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
};

// ─── Keyboard on desk ─────────────────────────────────────────────────────────
const Keyboard = () => {
  const keyRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cols = 10, rows = 4;
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    keyRefs.current.forEach((m, i) => {
      if (!m) return;
      const c = rgbCycle(t, (i % cols) * 0.08 + Math.floor(i / cols) * 0.18);
      (m.material as THREE.MeshBasicMaterial).color = c;
    });
  });
  return (
    <group position={[3.0, -0.455, -1.45]}>
      <mesh>
        <boxGeometry args={[0.72, 0.022, 0.26]} />
        <meshStandardMaterial color="#0d0d1e" roughness={0.4} metalness={0.7} />
      </mesh>
      {Array.from({ length: rows * cols }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { keyRefs.current[i] = el; }}
          position={[
            -0.3 + (i % cols) * 0.064,
            0.022,
            -0.085 + Math.floor(i / cols) * 0.062,
          ]}
        >
          <boxGeometry args={[0.046, 0.016, 0.048]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      ))}
    </group>
  );
};

// ─── Ceiling lamp ─────────────────────────────────────────────────────────────
const CeilingLamp: React.FC<{ position: [number, number, number]; phase?: number }> = ({
  position, phase = 0,
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.color = rgbCycle(clock.getElapsedTime(), phase);
      lightRef.current.intensity = 3.2 + Math.sin(clock.getElapsedTime() * 1.8 + phase) * 0.6;
    }
  });
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.07, 0.055, 10]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.3} metalness={0.9} />
      </mesh>
      <pointLight ref={lightRef} intensity={3.5} distance={5} castShadow />
    </group>
  );
};

// ─── Ambient room dust ────────────────────────────────────────────────────────
const RoomDust = () => {
  const ref = useRef<THREE.Points>(null);
  const positions = React.useMemo(() => {
    const count = 100;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 3.5 - 1.2;
      pos[i * 3 + 2] = Math.random() * 5 - 3;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (!ref.current) return;

    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 1; i < arr.length; i += 3) {
      arr[i] += 0.0004;
      if (arr[i] > 2.2) arr[i] = -1.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.016} color="#aabbff" transparent opacity={0.3}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// ─── Full scene ───────────────────────────────────────────────────────────────
const GamingRoomScene = () => (
  <group>
    <ambientLight intensity={0.15} />

    {/* Ceiling lamps */}
    <CeilingLamp position={[-1.2, 2.2, -1.2]} phase={0.0} />
    <CeilingLamp position={[3.0,  2.2, -1.2]} phase={0.4} />

    {/* Room structure */}
    <RoomShell />
    <NeonFloor />

    {/* RGB wall strips */}
    <RGBStrip position={[0,   2.24, -2.9]}  axis="x" length={8.5} phase={0.0} />
    <RGBStrip position={[0,  -1.18, -2.9]}  axis="x" length={8.5} phase={0.2} />
    <RGBStrip position={[-4.46, 0.5, -0.5]} axis="z" length={5.5} phase={0.4} />
    <RGBStrip position={[4.46,  0.5, -0.5]} axis="z" length={5.5} phase={0.6} />

    {/* ── TV Lounge area (left) ── */}
    <BigTV />
    <PS5Console />
    <Couch />



    {/* ── PC desk area (right) ── */}
    <Desk />
    <DeskMonitor />
    <Keyboard />

    {/* Floating dust */}
    <RoomDust />
  </group>
);

// ─── Canvas wrapper ───────────────────────────────────────────────────────────
const PS5Canvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Title overlay */}
      <div className="absolute top-3 left-0 right-0 text-center z-10 pointer-events-none select-none">
        <span className="text-[9px] sm:text-[11px] text-cyan-400 font-bold uppercase tracking-[0.2em] neon-text-blue block">
          PLAYSTATION 5 CAFE
        </span>
        <h2 className="text-[14px] sm:text-[18px] font-black uppercase tracking-wider text-white neon-text-purple font-mono whitespace-nowrap mt-0.5">
          AHMEDABAD GAMING
        </h2>
        <div className="h-[1.5px] w-28 mx-auto bg-gradient-to-r from-transparent via-[#bf61ff] to-transparent mt-1" />
      </div>

      <Canvas
        frameloop="always"
        shadows
        dpr={[1, 2]}
        camera={{
          position: isMobile ? [1.5, 2.2, 5.5] : [3.5, 2.2, 5.0],
          fov: isMobile ? 52 : 48,
        }}
        gl={{ preserveDrawingBuffer: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            target={[0.5, -0.3, -0.8]}
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 5}
            autoRotate
            autoRotateSpeed={0.4}
          />
          <GamingRoomScene />
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  );
};

export default PS5Canvas;

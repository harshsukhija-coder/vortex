import { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Preload } from '@react-three/drei';
import { random } from 'maath';
import { TypedArray } from 'three';
import SafeCanvas from './SafeCanvas';

const Stars = (props: any) => {
  const ref = useRef<THREE.Points>();
  const [sphere] = useState<TypedArray>(() =>
    random.inSphere(new Float32Array(5001), { radius: 1.2 })
  );

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled {...props}>
        <PointMaterial
          transparent
          color="#f272c8"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsFallback = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-[-1] opacity-40"
    style={{
      backgroundImage:
        'radial-gradient(1px 1px at 20% 30%, rgba(242,114,200,0.7), transparent),' +
        'radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.55), transparent),' +
        'radial-gradient(1px 1px at 70% 40%, rgba(0,240,255,0.45), transparent),' +
        'radial-gradient(1px 1px at 85% 20%, rgba(242,114,200,0.5), transparent),' +
        'radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.35), transparent),' +
        'radial-gradient(1.5px 1.5px at 55% 15%, rgba(145,94,255,0.6), transparent)',
      backgroundSize: '100% 100%',
    }}
  />
);

const StarsCanvas = () => {
  return (
    <SafeCanvas fallback={<StarsFallback />}>
      <div className="absolute inset-0 z-[-1] h-auto w-full">
        <Canvas
          camera={{ position: [0, 0, 1] }}
          gl={{
            antialias: false,
            powerPreference: 'low-power',
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Suspense fallback={null}>
            <Stars />
          </Suspense>
          <Preload all />
        </Canvas>
      </div>
    </SafeCanvas>
  );
};

export default StarsCanvas;

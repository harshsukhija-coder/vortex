import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';

import CanvasLoader from '../layout/Loader';
import SafeCanvas from './SafeCanvas';

const Earth = () => {
  const earth = useGLTF('./planet/scene.gltf');

  return (
    <primitive object={earth.scene} scale={2.5} position-y={0} rotation-y={0} />
  );
};

const EarthFallback = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="h-40 w-40 rounded-full bg-gradient-to-br from-[#915EFF]/40 via-cyan-400/20 to-transparent blur-sm sm:h-56 sm:w-56" />
  </div>
);

const EarthCanvas = () => {
  return (
    <SafeCanvas fallback={<EarthFallback />}>
      <Canvas
        shadows
        frameloop="demand"
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{
          fov: 45,
          near: 0.1,
          far: 200,
          position: [-4, 3, 6],
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls
            autoRotate
            enablePan={false}
            enableZoom={false}
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 2}
          />
          <Earth />
          <Preload all />
        </Suspense>
      </Canvas>
    </SafeCanvas>
  );
};

export default EarthCanvas;

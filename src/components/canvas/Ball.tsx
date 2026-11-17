import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Decal,
  Float,
  OrbitControls,
  Preload,
  useTexture,
} from "@react-three/drei";

import CanvasLoader from "../layout/Loader";
import SafeCanvas from "./SafeCanvas";

const Ball = (props: any) => {
  const [decal] = useTexture([props.imgUrl]);

  return (
    <Float speed={1.75} rotationIntensity={1} floatIntensity={2}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[0, 0, 0.05]} />
      <mesh castShadow receiveShadow scale={2.75}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#fff8eb"
          polygonOffset
          polygonOffsetFactor={-5}
          flatShading
        />
        <Decal
          position={[0, 0, 1]}
          rotation={[2 * Math.PI, 0, 6.25]}
          scale={1}
          map={decal}
          // @ts-expect-error
          flatShading
        />
      </mesh>
    </Float>
  );
};

const BallCanvas: React.FC<{ icon: string }> = ({ icon }) => {
  return (
    <SafeCanvas fallback={<img src={icon} alt="" className="mx-auto h-16 w-16 object-contain opacity-80" />}>
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          powerPreference: "low-power",
          failIfMajorPerformanceCaveat: false,
        }}
      >
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls enablePan={false} enableZoom={false} />
          <Ball imgUrl={icon} />
        </Suspense>

        <Preload all />
      </Canvas>
    </SafeCanvas>
  );
};

export default BallCanvas;

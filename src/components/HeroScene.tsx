'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PointMaterial, Points } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(1200 * 3);
    for (let i = 0; i < arr.length; i += 1) {
      arr[i] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#818cf8" size={0.035} sizeAttenuation depthWrite={false} opacity={0.8} />
    </Points>
  );
}

function RotatingShapes() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.15;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
  });
  return (
    <group ref={group}>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
        <mesh position={[2.8, 0.5, 0]}>
          <icosahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#6366f1" wireframe />
        </mesh>
      </Float>
      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh position={[-3, -0.6, 0.6]}>
          <torusKnotGeometry args={[0.55, 0.18, 96, 16]} />
          <meshStandardMaterial color="#a78bfa" roughness={0.25} metalness={0.6} />
        </mesh>
      </Float>
      <Float speed={2.4} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[0.3, -1.8, -0.6]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#22d3ee" wireframe />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      <Canvas camera={{ position: [0, 0, 7], fov: 55 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[6, 6, 6]} intensity={1.2} />
        <ParticleField />
        <RotatingShapes />
      </Canvas>
    </div>
  );
}

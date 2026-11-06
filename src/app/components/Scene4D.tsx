"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Ring, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedCrystal() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.4) * 0.15;
    }
  });
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} scale={1.6} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.8}
          roughness={0.15}
          metalness={0.9}
          distort={0.35}
          speed={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
}

function OrbitRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[3.2, 0.03, 16, 100]} />
      <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.5} roughness={0.2} metalness={1} transparent opacity={0.6} />
    </mesh>
  );
}

function SecondRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.getElapsedTime() * 0.2;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.15) * 0.4;
    }
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 3, 0, 0]}>
      <torusGeometry args={[2.6, 0.02, 12, 80]} />
      <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.4} roughness={0.3} metalness={0.8} transparent opacity={0.5} />
    </mesh>
  );
}

function GlowingSphere() {
  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={[1.5, 0.8, -1]} scale={0.35}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} roughness={0.05} metalness={0.95} />
      </mesh>
    </Float>
  );
}

function SmallSpheres() {
  return (
    <group>
      {[
        [-2.5, -1.2, 0.5],
        [2.2, -0.6, -1.8],
        [0.8, 1.4, 2],
        [-1.1, -1.5, -2.2],
        [2.8, 0.3, 1.5],
      ].map((pos, i) => (
        <Float key={i} speed={1 + i * 0.5} rotationIntensity={0.2} floatIntensity={0.8}>
          <mesh position={pos as [number, number, number]} scale={0.2 + i * 0.05}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#fb923c" : "#fbbf24"}
              emissive={i % 2 === 0 ? "#fb923c" : "#fbbf24"}
              emissiveIntensity={1.5}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Scene4D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#fff5e6" />
        <spotLight position={[-5, 5, 0]} intensity={4} color="#f59e0b" angle={0.3} penumbra={0.5} castShadow />
        <pointLight position={[0, -3, 0]} intensity={3} color="#38bdf8" />

        <AnimatedCrystal />
        <OrbitRing />
        <SecondRing />
        <GlowingSphere />
        <SmallSpheres />
        <Ring args={[4, 0.02, 8]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.3} transparent opacity={0.3} />
        </Ring>

        <Sparkles count={60} scale={[12, 8, 12]} size={2} speed={0.5} opacity={0.7} color="#fbbf24" />
        <Sparkles count={40} scale={[10, 6, 10]} size={1.5} speed={0.8} opacity={0.5} color="#38bdf8" />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}

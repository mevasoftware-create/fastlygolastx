import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Step3DCardProps {
  number: number;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  details: string[];
  gradient: string;
  bgGradient: string;
  illustration: string;
  isActive: boolean;
}

// 3D Cube Component
function AnimatedCube({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.008;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

// 3D Sphere Component
function AnimatedSphere({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.2} wireframe={false} />
    </mesh>
  );
}

// 3D Torus Component
function AnimatedTorus({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.z += 0.008;
    }
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.7, 0.2, 16, 100]} />
      <meshPhongMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

// 3D Scene Component
function Scene3D({ number, color }: { number: number; color: string }) {
  const shapes = [
    <AnimatedCube key="cube" color={color} />,
    <AnimatedSphere key="sphere" color={color} />,
    <AnimatedTorus key="torus" color={color} />,
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} />
      <OrbitControls 
        enableZoom={false} 
        autoRotate 
        autoRotateSpeed={4}
        enablePan={false}
      />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#ff6b35" />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {shapes[number - 1]}
      </Float>
    </>
  );
}

export default function Step3DCard({
  number,
  icon: Icon,
  title,
  description,
  details,
  gradient,
  bgGradient,
  illustration,
  isActive,
}: Step3DCardProps) {
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    setCanvasReady(true);
  }, []);

  // Extract color from gradient for 3D object
  const colorMap: Record<number, string> = {
    1: '#a855f7', // purple
    2: '#0ea5e9', // cyan
    3: '#10b981', // emerald
  };

  return (
    <div
      className={`group relative transition-all duration-500 ${
        isActive ? 'scale-105 md:scale-110' : 'scale-100'
      }`}
    >
      {/* Main Card */}
      <div
        className={`relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border-2 h-full ${
          isActive ? 'border-orange-400' : 'border-gray-200 hover:border-orange-300'
        }`}
      >
        {/* Animated Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        {/* 3D Canvas Container */}
        <div className="relative h-64 md:h-72 bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl overflow-hidden group-hover:from-gray-800 group-hover:to-gray-700 transition-all duration-500">
          {canvasReady && (
            <Canvas
              style={{ width: '100%', height: '100%' }}
              gl={{ antialias: true, alpha: true }}
            >
              <Scene3D number={number} color={colorMap[number]} />
            </Canvas>
          )}

          {/* Overlay Gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Step Number Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}
            >
              <span className="text-white font-bold text-2xl">{number}</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 p-8 md:p-10">
          {/* Icon */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 border border-gray-100">
                <Icon className="w-10 h-10 text-orange-500 group-hover:scale-110 transition-transform duration-500" strokeWidth={2} />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-orange-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors duration-300">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            {description}
          </p>

          {/* Details List */}
          <div className="space-y-2">
            {details.map((detail, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-gray-700 group/item hover:translate-x-2 transition-transform duration-300"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-medium text-sm">{detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Corner Element */}
        <div
          className={`absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl ${gradient} opacity-5 group-hover:opacity-10 rounded-tl-full transition-opacity duration-500`}
        />
      </div>

      {/* Hover Shadow Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-500 -z-10" />
    </div>
  );
}

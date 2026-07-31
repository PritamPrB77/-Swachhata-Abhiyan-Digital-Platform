import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const SIZE_TRUCK = [0.9, 0.35, 0.45] as [number, number, number];
const SIZE_CAB = [0.35, 0.28, 0.42] as [number, number, number];
const SIZE_PHONE = [0.55, 1.05, 0.08] as [number, number, number];
const SIZE_SCREEN = [0.46, 0.82, 0.02] as [number, number, number];
const SIZE_ROAD = [3.6, 0.08, 2.4] as [number, number, number];
const WHEEL = [0.1, 0.1, 0.08] as [number, number, number];

function Building({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <RoundedBox args={size} radius={0.06} smoothness={2} position={position}>
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
    </RoundedBox>
  );
}

function Truck() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.x = -1.2 + Math.sin(state.clock.elapsedTime * 0.35) * 1.6;
  });
  return (
    <group ref={ref} position={[-1.2, 0.22, 0.9]} rotation={[0, Math.PI / 2, 0]}>
      <RoundedBox args={SIZE_TRUCK} radius={0.05} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#0F9D58" />
      </RoundedBox>
      <RoundedBox args={SIZE_CAB} radius={0.04} position={[0.45, 0.2, 0]}>
        <meshStandardMaterial color="#0EA5E9" />
      </RoundedBox>
      {[
        [-0.25, -0.05, 0.22],
        [0.28, -0.05, 0.22],
        [-0.25, -0.05, -0.22],
        [0.28, -0.05, -0.22],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={WHEEL} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
    </group>
  );
}

function GeoPin() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 1.15 + Math.sin(state.clock.elapsedTime * 2) * 0.12;
  });
  return (
    <group ref={ref} position={[0.9, 1.15, 0.2]}>
      <mesh>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial color="#F97316" emissive="#F97316" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.28, 16]} />
        <meshStandardMaterial color="#F97316" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]}>
        <ringGeometry args={[0.18, 0.28, 32]} />
        <meshBasicMaterial color="#F97316" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

function PhoneMock() {
  return (
    <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.25}>
      <group position={[1.7, 0.95, 0.6]} rotation={[-0.35, -0.45, -0.15]}>
        <RoundedBox args={SIZE_PHONE} radius={0.06}>
          <meshStandardMaterial color="#111827" />
        </RoundedBox>
        <RoundedBox args={SIZE_SCREEN} radius={0.02} position={[0, 0.05, 0.05]}>
          <meshStandardMaterial color="#22C55E" emissive="#0F9D58" emissiveIntensity={0.2} />
        </RoundedBox>
      </group>
    </Float>
  );
}

function CityBlock() {
  const buildings = useMemo(
    () => [
      { pos: [-1.4, 0.55, -0.6] as [number, number, number], size: [0.7, 1.1, 0.7] as [number, number, number], color: "#d1fae5" },
      { pos: [-0.5, 0.8, -0.9] as [number, number, number], size: [0.6, 1.6, 0.6] as [number, number, number], color: "#a7f3d0" },
      { pos: [0.4, 0.45, -0.5] as [number, number, number], size: [0.8, 0.9, 0.7] as [number, number, number], color: "#bbf7d0" },
      { pos: [1.3, 0.7, -0.8] as [number, number, number], size: [0.55, 1.4, 0.55] as [number, number, number], color: "#86efac" },
      { pos: [-1.1, 0.35, 0.2] as [number, number, number], size: [0.5, 0.7, 0.5] as [number, number, number], color: "#ecfdf5" },
    ],
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#ecfdf5" />
      </mesh>
      <RoundedBox args={SIZE_ROAD} radius={0.04} position={[0, 0.02, 0.15]}>
        <meshStandardMaterial color="#94a3b8" />
      </RoundedBox>
      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} size={b.size} color={b.color} />
      ))}
      <Truck />
      <GeoPin />
      <PhoneMock />
      <mesh position={[-0.2, 0.08, 0.9]}>
        <boxGeometry args={[2.8, 0.02, 0.35]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
}

function SceneCameraRig({ mouse }: { mouse: MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouse.current.x * 0.6, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 2.2 + mouse.current.y * 0.3, 0.05);
    state.camera.lookAt(0, 0.4, 0);
  });
  return null;
}

export function CityScene({ className = "" }: { className?: string }) {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className={className}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mouse.current = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * -2,
        };
      }}
    >
      <Canvas camera={{ position: [2.8, 2.4, 4.2], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 6, 3]} intensity={1.25} />
        <pointLight position={[-2, 3, 2]} intensity={0.4} color="#0EA5E9" />
        <CityBlock />
        <SceneCameraRig mouse={mouse} />
      </Canvas>
    </div>
  );
}

/** @deprecated use CityScene */
export function HeroScene() {
  return <CityScene className="absolute inset-0 -z-10 opacity-90" />;
}

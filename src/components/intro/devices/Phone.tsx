"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { deviceBodyGeometry, disposeAll, roundedRectGeometry } from "../geometry";
import { clamp01, easeInOut, type DeviceProps, type DeviceSpec } from "../types";

// Proportions of a current flagship phone (world units).
const W = 1.46;
const H = 3.0;
const D = 0.16;
const R = 0.24;
const SCREEN = { w: W - 0.1, h: H - 0.1, r: R - 0.05 };

export const phoneSpec: DeviceSpec = {
  canvas: [600, 1280],
  screen: { w: SCREEN.w, h: SCREEN.h },
  extents: [W / 2 + 0.25, H / 2 + 0.3],
  cam: { closed: [0, 0.35, 7], lookClosed: [0, 0, 0], open: [0, 0.05, 6], lookOpen: [0, 0, 0] },
  fov: 35,
  shadow: false,
  frontLights: true,
  tilt: 0.22,
};

// Black, but reflective enough that edges and lenses catch the studio light.
const black = {
  frame: { color: "#4a4c52", metalness: 0.9, roughness: 0.22, envMapIntensity: 2.2 },
  glass: { color: "#050506", metalness: 0.2, roughness: 0.06, envMapIntensity: 1.5 },
  back: { color: "#202126", metalness: 0.3, roughness: 0.38, envMapIntensity: 1.6 },
  lensRing: { color: "#6a6c72", metalness: 0.9, roughness: 0.2, envMapIntensity: 2 },
  lens: { color: "#0b1020", metalness: 0.6, roughness: 0.05, envMapIntensity: 2 },
};

/**
 * Black phone: titanium-style frame, glass front with a Dynamic Island,
 * matte glass back with a dual camera. Turns from its back to face the viewer.
 */
export function Phone({ progress, screenTex, screenRef }: DeviceProps) {
  const root = useRef<THREE.Group>(null);
  const geo = useMemo(
    () => ({
      body: deviceBodyGeometry(W, H, R, D, 0.035),
      front: roundedRectGeometry(W - 0.02, H - 0.02, R - 0.01),
      screen: roundedRectGeometry(SCREEN.w, SCREEN.h, SCREEN.r),
      island: roundedRectGeometry(0.38, 0.11, 0.055),
      back: roundedRectGeometry(W - 0.02, H - 0.02, R - 0.01),
      bump: deviceBodyGeometry(0.66, 0.66, 0.16, 0.05, 0.012),
    }),
    []
  );
  useEffect(() => () => disposeAll(geo), [geo]);

  useFrame(() => {
    const t = easeInOut(clamp01(progress.current.open));
    if (!root.current) return;
    // Starts turned around (camera side visible), spins to face the viewer.
    root.current.rotation.y = (Math.PI + 0.55) * (1 - t);
    root.current.rotation.x = 0.18 * (1 - t);
    root.current.position.y = -0.15 * (1 - t);
  });

  // Lens: metal ring (cylinder along z) with dark glass facing backwards.
  const lens = (x: number, y: number) => (
    <group position={[x, y, -D / 2 - 0.05]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.125, 0.125, 0.035, 40]} />
        <meshStandardMaterial {...black.lensRing} />
      </mesh>
      <mesh position={[0, 0, -0.0185]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.09, 40]} />
        <meshStandardMaterial {...black.lens} />
      </mesh>
    </group>
  );

  return (
    <group ref={root}>
      <mesh geometry={geo.body}>
        <meshStandardMaterial {...black.frame} />
      </mesh>

      {/* Front: glass, screen, Dynamic Island */}
      <mesh geometry={geo.front} position={[0, 0, D / 2 + 0.001]}>
        <meshStandardMaterial {...black.glass} />
      </mesh>
      <mesh ref={screenRef} geometry={geo.screen} position={[0, 0, D / 2 + 0.002]}>
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.island} position={[0, SCREEN.h / 2 - 0.12, D / 2 + 0.003]}>
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Back: matte glass + camera plateau (top-left when seen from behind) */}
      <mesh geometry={geo.back} position={[0, 0, -D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial {...black.back} />
      </mesh>
      <mesh geometry={geo.bump} position={[W / 2 - 0.42, H / 2 - 0.42, -D / 2 - 0.025]}>
        <meshStandardMaterial {...black.glass} />
      </mesh>
      {lens(W / 2 - 0.27, H / 2 - 0.27)}
      {lens(W / 2 - 0.57, H / 2 - 0.57)}
      <mesh position={[W / 2 - 0.27, H / 2 - 0.57, -D / 2 - 0.051]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.035, 24]} />
        <meshStandardMaterial color="#d8d2c4" emissive="#3a362e" roughness={0.4} />
      </mesh>

      {/* Side buttons */}
      <mesh position={[W / 2 + 0.006, 0.55, 0]}>
        <boxGeometry args={[0.02, 0.42, 0.06]} />
        <meshStandardMaterial {...black.frame} />
      </mesh>
      <mesh position={[W / 2 + 0.006, -0.35, 0]}>
        <boxGeometry args={[0.012, 0.24, 0.05]} />
        <meshStandardMaterial {...black.lensRing} />
      </mesh>
      {[0.95, 0.6, 0.25].map((y, i) => (
        <mesh key={y} position={[-W / 2 - 0.006, y, 0]}>
          <boxGeometry args={[0.02, i === 0 ? 0.14 : 0.28, 0.06]} />
          <meshStandardMaterial {...black.frame} />
        </mesh>
      ))}
    </group>
  );
}

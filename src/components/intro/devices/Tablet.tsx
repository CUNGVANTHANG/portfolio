"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { deviceBodyGeometry, disposeAll, roundedRectGeometry } from "../geometry";
import { clamp01, easeInOut, type DeviceProps, type DeviceSpec } from "../types";

// Pro-style tablet in portrait (world units): very thin, uniform slim bezels.
const W = 2.0;
const H = 2.8;
const D = 0.06;
const R = 0.13;
const SCREEN = { w: W - 0.14, h: H - 0.14, r: R - 0.06 };
const COVER_D = 0.03;
const OPEN_ANGLE = Math.PI * 0.9;

export const tabletSpec: DeviceSpec = {
  canvas: [820, 1160],
  screen: { w: SCREEN.w, h: SCREEN.h },
  extents: [W / 2 + 0.3, H / 2 + 0.3],
  cam: { closed: [0.4, 0.35, 7.4], lookClosed: [0, 0, 0], open: [0, 0.05, 6.6], lookOpen: [0, 0, 0] },
  fov: 35,
  shadow: false,
  frontLights: true,
  tilt: 0.16,
};

// Black, but reflective enough that edges catch the studio light.
const black = {
  body: { color: "#3a3c41", metalness: 0.85, roughness: 0.3, envMapIntensity: 2 },
  glass: { color: "#050506", metalness: 0.2, roughness: 0.06, envMapIntensity: 1.5 },
  cover: { color: "#16171a", metalness: 0.1, roughness: 0.75, envMapIntensity: 1.2 },
  coverInside: { color: "#222327", metalness: 0, roughness: 0.9 },
};

/**
 * Black tablet in a folio cover. The cover swings open like a book
 * (hinged on the left edge) to reveal the screen.
 */
export function Tablet({ progress, screenTex, screenRef }: DeviceProps) {
  const root = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);
  const geo = useMemo(
    () => ({
      body: deviceBodyGeometry(W, H, R, D, 0.012),
      front: roundedRectGeometry(W - 0.01, H - 0.01, R - 0.005),
      screen: roundedRectGeometry(SCREEN.w, SCREEN.h, SCREEN.r),
      cover: deviceBodyGeometry(W + 0.02, H + 0.02, R + 0.01, COVER_D, 0.008),
      coverInside: roundedRectGeometry(W - 0.02, H - 0.02, R - 0.01),
      bump: deviceBodyGeometry(0.46, 0.46, 0.12, 0.03, 0.01),
    }),
    []
  );
  useEffect(() => () => disposeAll(geo), [geo]);

  useFrame(() => {
    const t = easeInOut(clamp01(progress.current.open));
    if (hinge.current) hinge.current.rotation.y = -OPEN_ANGLE * t;
    if (root.current) {
      // Angled toward the hinge side, settling square to the viewer.
      root.current.rotation.y = 0.45 * (1 - t);
      root.current.rotation.x = 0.08 * (1 - t);
    }
  });

  return (
    <group ref={root}>
      <mesh geometry={geo.body}>
        <meshStandardMaterial {...black.body} />
      </mesh>
      <mesh geometry={geo.front} position={[0, 0, D / 2 + 0.001]}>
        <meshStandardMaterial {...black.glass} />
      </mesh>
      <mesh ref={screenRef} geometry={geo.screen} position={[0, 0, D / 2 + 0.002]}>
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>
      {/* Front camera on the long (left) bezel, as on landscape-first tablets */}
      <mesh position={[-W / 2 + 0.035, 0, D / 2 + 0.003]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#1c2230" />
      </mesh>

      {/* Back camera module */}
      <mesh geometry={geo.bump} position={[W / 2 - 0.33, H / 2 - 0.33, -D / 2 - 0.015]}>
        <meshStandardMaterial {...black.glass} />
      </mesh>
      {[
        [W / 2 - 0.24, H / 2 - 0.24, 0.07],
        [W / 2 - 0.42, H / 2 - 0.42, 0.07],
        [W / 2 - 0.42, H / 2 - 0.24, 0.04],
      ].map(([x, y, r]) => (
        <group key={`${x}-${y}`} position={[x, y, -D / 2 - 0.03]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[r + 0.02, r + 0.02, 0.012, 32]} />
            <meshStandardMaterial color="#6a6c72" metalness={0.9} roughness={0.2} envMapIntensity={2} />
          </mesh>
          <mesh position={[0, 0, -0.0065]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[r, 32]} />
            <meshStandardMaterial color="#0b1020" metalness={0.6} roughness={0.05} envMapIntensity={2} />
          </mesh>
        </group>
      ))}

      {/* Folio cover, hinged on the left edge in front of the screen */}
      <group ref={hinge} position={[-W / 2 - 0.01, 0, D / 2 + COVER_D / 2 + 0.004]}>
        <mesh geometry={geo.cover} position={[W / 2 + 0.01, 0, 0]}>
          <meshStandardMaterial {...black.cover} />
        </mesh>
        <mesh geometry={geo.coverInside} position={[W / 2 + 0.01, 0, -COVER_D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial {...black.coverInside} />
        </mesh>
      </group>
    </group>
  );
}

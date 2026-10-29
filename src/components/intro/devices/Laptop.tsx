"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { deviceBodyGeometry, disposeAll, roundedRectGeometry } from "../geometry";
import { createKeyboardTexture, createSpeakerTexture } from "../textures";
import { clamp01, easeInOut, type DeviceProps, type DeviceSpec } from "../types";

/*
 * MacBook Pro 14"-style proportions (world units, ~1 unit ≈ 98 mm):
 * 312 × 221 mm footprint, ~15.5 mm closed, generous corner radius.
 */
const W = 3.2;
const D = 2.24;
const R = 0.16;
const BASE_T = 0.105;
const LID_T = 0.055;
const HINGE_Y = BASE_T + 0.004;
const HINGE_Z = -D / 2;
const OPEN_ANGLE = Math.PI / 2 + 0.28;

// Display: thin side/top bezels, thicker chin, camera notch at the top.
const SCREEN = { w: 3.04, h: 1.97, chin: 0.19 };
const SCREEN_CENTER = SCREEN.chin + SCREEN.h / 2;

// Deck layout (z grows toward the front edge).
const KEYBOARD = { w: 2.64, d: 1.0, z: -0.43 };
const TRACKPAD = { w: 1.52, d: 0.9, z: 0.62 };

export const laptopSpec: DeviceSpec = {
  canvas: [1024, 664],
  screen: { w: SCREEN.w, h: SCREEN.h },
  extents: [W / 2 + 0.45, 1.3],
  cam: { closed: [0, 3.4, 6.4], lookClosed: [0, 0, -0.2], open: [0, 1.75, 6.2], lookOpen: [0, 0.85, -0.7] },
  fov: 35,
  shadow: true,
  frontLights: false,
  tilt: 0.18,
};

const mat = {
  aluminium: { color: "#c9ccd1", metalness: 0.85, roughness: 0.32, envMapIntensity: 1.1 },
  glass: { color: "#050506", metalness: 0.2, roughness: 0.12 },
  hinge: { color: "#202124", metalness: 0.7, roughness: 0.4 },
  port: { color: "#0d0d0f", metalness: 0.3, roughness: 0.6 },
};

/** Lay a +Z-facing geometry flat so it faces up (+Y), top edge toward the back. */
const flat = (g: THREE.BufferGeometry) => g.rotateX(-Math.PI / 2);

/** MacBook Pro–style silver laptop; the lid opens with `progress.open`. */
export function Laptop({ progress, screenTex, screenRef }: DeviceProps) {
  const root = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);
  const tex = useMemo(() => ({ keyboard: createKeyboardTexture(), speaker: createSpeakerTexture() }), []);
  const geo = useMemo(
    () => ({
      base: flat(deviceBodyGeometry(W, D, R, BASE_T, 0.022)),
      lid: flat(deviceBodyGeometry(W, D, R, LID_T, 0.016)),
      keyboard: flat(roundedRectGeometry(KEYBOARD.w, KEYBOARD.d, 0.035)),
      speaker: flat(roundedRectGeometry(0.18, KEYBOARD.d, 0.02)),
      groove: flat(roundedRectGeometry(TRACKPAD.w + 0.02, TRACKPAD.d + 0.02, 0.07)),
      pad: flat(roundedRectGeometry(TRACKPAD.w, TRACKPAD.d, 0.06)),
      bezel: roundedRectGeometry(W - 0.03, D - 0.03, R - 0.015),
      screen: roundedRectGeometry(SCREEN.w, SCREEN.h, 0.035),
      notch: roundedRectGeometry(0.34, 0.075, 0.03),
    }),
    []
  );

  useEffect(
    () => () => {
      tex.keyboard.dispose();
      tex.speaker.dispose();
      disposeAll(geo);
    },
    [tex, geo]
  );

  useFrame(() => {
    const t = easeInOut(clamp01(progress.current.open));
    if (hinge.current) hinge.current.rotation.x = -t * OPEN_ANGLE;
    // Turn to face the viewer as the lid opens.
    if (root.current) root.current.rotation.y = -0.55 * (1 - t);
  });

  const deckY = BASE_T + 0.0008;

  // Side ports: [z centre, length, height] on each edge, back to front.
  const leftPorts: [number, number, number][] = [
    [-0.82, 0.14, 0.024], // MagSafe
    [-0.6, 0.085, 0.03], // Thunderbolt
    [-0.43, 0.085, 0.03], // Thunderbolt
    [0.78, 0.036, 0.036], // headphone
  ];
  const rightPorts: [number, number, number][] = [
    [-0.7, 0.2, 0.014], // SD card
    [-0.38, 0.085, 0.03], // Thunderbolt
    [0.62, 0.15, 0.045], // HDMI
  ];

  return (
    <group ref={root}>
      {/* Base */}
      <mesh geometry={geo.base} position={[0, BASE_T / 2, 0]}>
        <meshStandardMaterial {...mat.aluminium} />
      </mesh>
      {/* Keyboard in its black well, flanked by speaker grilles */}
      <mesh geometry={geo.keyboard} position={[0, deckY, KEYBOARD.z]}>
        <meshStandardMaterial map={tex.keyboard} roughness={0.55} metalness={0.1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={geo.speaker} position={[side * 1.47, deckY, KEYBOARD.z]}>
          <meshStandardMaterial map={tex.speaker} transparent roughness={0.6} depthWrite={false} />
        </mesh>
      ))}
      {/* Force Touch trackpad: matte glass in a fine groove, flush with the deck */}
      <mesh geometry={geo.groove} position={[0, BASE_T + 0.0004, TRACKPAD.z]}>
        <meshStandardMaterial color="#8d9097" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh geometry={geo.pad} position={[0, deckY, TRACKPAD.z]}>
        <meshStandardMaterial color="#b9bcc2" metalness={0.35} roughness={0.62} envMapIntensity={0.7} />
      </mesh>
      {/* Front thumb scoop */}
      <mesh position={[0, BASE_T - 0.004, D / 2 + 0.0006]}>
        <boxGeometry args={[0.5, 0.007, 0.002]} />
        <meshStandardMaterial color="#9a9ea5" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Ports */}
      {leftPorts.map(([z, len, h]) => (
        <mesh key={`l${z}`} position={[-W / 2 - 0.0008, BASE_T * 0.48, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[len, h]} />
          <meshStandardMaterial {...mat.port} />
        </mesh>
      ))}
      {rightPorts.map(([z, len, h]) => (
        <mesh key={`r${z}`} position={[W / 2 + 0.0008, BASE_T * 0.48, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[len, h]} />
          <meshStandardMaterial {...mat.port} />
        </mesh>
      ))}
      {/* Dark hinge bar along the back edge */}
      <mesh position={[0, HINGE_Y, HINGE_Z + 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.042, 0.042, W - 0.7, 24]} />
        <meshStandardMaterial {...mat.hinge} />
      </mesh>

      {/* Lid on its hinge */}
      <group ref={hinge} position={[0, HINGE_Y, HINGE_Z]}>
        <mesh geometry={geo.lid} position={[0, LID_T / 2, D / 2]}>
          <meshStandardMaterial {...mat.aluminium} />
        </mesh>
        {/* Inner face: black glass, display, camera notch */}
        <mesh geometry={geo.bezel} position={[0, -0.001, D / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial {...mat.glass} />
        </mesh>
        <mesh ref={screenRef} geometry={geo.screen} position={[0, -0.002, SCREEN_CENTER]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
        <mesh geometry={geo.notch} position={[0, -0.003, SCREEN.chin + SCREEN.h - 0.036]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, -0.0035, SCREEN.chin + SCREEN.h - 0.036]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.011, 16]} />
          <meshBasicMaterial color="#1b2333" />
        </mesh>
      </group>
    </group>
  );
}

import type { RefObject } from "react";
import type * as THREE from "three";

/** Animated by the intro timeline (GSAP), read every frame by the 3D scene. */
export type IntroProgress = {
  /** Device reveal: lid opening / phone turning around / tablet cover opening. 0..1 */
  open: number;
  /** Screen boot, 0..1 (see drawScreen). */
  boot: number;
  /** Camera flight into the screen, 0..1. */
  dive: number;
};

export type DeviceKind = "phone" | "tablet" | "laptop";

export type Vec3 = [number, number, number];

export type DeviceSpec = {
  /** Screen canvas resolution in px (matches the screen's aspect ratio). */
  canvas: [number, number];
  /** Screen size in world units — used to fly the camera until it fills the view. */
  screen: { w: number; h: number };
  /** Half width/height the camera must keep in view while framing the device. */
  extents: [number, number];
  /** Camera position + target before and after the reveal. */
  cam: { closed: Vec3; lookClosed: Vec3; open: Vec3; lookOpen: Vec3 };
  fov: number;
  /** Soft floor shadow (for devices resting on a surface). */
  shadow: boolean;
  /** Extra front strip lights — dark devices need them to show their form. */
  frontLights: boolean;
  /** How far the device leans toward the pointer (radians). */
  tilt: number;
};

export type DeviceProps = {
  progress: RefObject<IntroProgress>;
  screenTex: THREE.Texture;
  screenRef: RefObject<THREE.Mesh | null>;
};

export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Phone for small screens, tablet for portrait-ish mid sizes, laptop otherwise. */
export function pickDevice(width: number, height: number): DeviceKind {
  if (Math.min(width, height) < 600) return "phone";
  if (width / height < 1.2) return "tablet";
  return "laptop";
}

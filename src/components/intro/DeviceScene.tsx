"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ComponentType, type RefObject } from "react";
import * as THREE from "three";
import { Laptop, laptopSpec } from "./devices/Laptop";
import { Phone, phoneSpec } from "./devices/Phone";
import { Tablet, tabletSpec } from "./devices/Tablet";
import { createShadowTexture, drawScreen } from "./textures";
import { clamp01, easeInOut, type DeviceKind, type DeviceProps, type DeviceSpec, type IntroProgress } from "./types";

const DEVICES: Record<DeviceKind, { spec: DeviceSpec; Model: ComponentType<DeviceProps> }> = {
  phone: { spec: phoneSpec, Model: Phone },
  tablet: { spec: tabletSpec, Model: Tablet },
  laptop: { spec: laptopSpec, Model: Laptop },
};

/** Screen redraws are capped (the boot animation reads fine at 30fps). */
const SCREEN_FPS = 30;

type RigProps = {
  kind: DeviceKind;
  progress: RefObject<IntroProgress>;
  onReady: () => void;
  lowPower: boolean;
};

/**
 * Shared choreography for every device: pointer tilt and idle float, the boot
 * screen texture, camera framing, and the final flight into the screen.
 */
function Rig({ kind, progress, onReady, lowPower }: RigProps) {
  const { spec, Model } = DEVICES[kind];
  const wrapper = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const diveFrom = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null);
  const lastBoot = useRef(-1);
  const lastDraw = useRef(0);
  const { camera, size, gl, scene } = useThree();

  const screen = useMemo(() => {
    // Smaller canvas on low-power devices: less to draw and upload each update.
    const scale = lowPower ? 0.75 : 1;
    const c = document.createElement("canvas");
    c.width = Math.round(spec.canvas[0] * scale);
    c.height = Math.round(spec.canvas[1] * scale);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { ctx: c.getContext("2d")!, tex };
  }, [spec, lowPower]);

  // The texture is mutated every frame, so frame code reaches it through a ref.
  const screenRefObj = useRef(screen);
  useEffect(() => {
    screenRefObj.current = screen;
    return () => screen.tex.dispose();
  }, [screen]);

  const v = useMemo(
    () => ({
      camClosed: new THREE.Vector3(...spec.cam.closed),
      lookClosed: new THREE.Vector3(...spec.cam.lookClosed),
      camOpen: new THREE.Vector3(...spec.cam.open),
      lookOpen: new THREE.Vector3(...spec.cam.lookOpen),
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      normal: new THREE.Vector3(),
      center: new THREE.Vector3(),
      target: new THREE.Vector3(),
      q: new THREE.Quaternion(),
    }),
    [spec]
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    // Before starting: compile every shader up front, so nothing stalls mid-animation.
    let cancelled = false;
    const compile = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera));
    compile
      .catch(() => {})
      .then(() => requestAnimationFrame(() => requestAnimationFrame(() => !cancelled && onReady())));
    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", move);
    };
  }, [onReady, gl, scene, camera]);

  useFrame(({ clock }, delta) => {
    const p = progress.current;
    const open = easeInOut(clamp01(p.open));

    // Lean toward the pointer and float gently (not during the dive).
    if (wrapper.current) {
      const g = wrapper.current;
      const follow = p.dive > 0 ? 0 : 1;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.current.x * spec.tilt * follow, 4, delta);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, pointer.current.y * spec.tilt * 0.35 * follow, 4, delta);
      g.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.03 * (1 - p.dive);
    }

    // Redraw the screen only while it changes, at most SCREEN_FPS times a second.
    const animating = p.boot !== lastBoot.current;
    const due = clock.elapsedTime - lastDraw.current >= 1 / SCREEN_FPS || p.boot >= 1;
    if (animating && due) {
      lastDraw.current = clock.elapsedTime;
      const sc = screenRefObj.current;
      drawScreen(sc.ctx, p.boot);
      sc.tex.needsUpdate = true;
      lastBoot.current = p.boot;
    }

    // Camera: frame the device, keeping it fully in view on any aspect ratio…
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const halfV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
    v.pos.lerpVectors(v.camClosed, v.camOpen, open);
    v.look.lerpVectors(v.lookClosed, v.lookOpen, open);
    const fitDist = Math.max(spec.extents[0] / (halfV * aspect), spec.extents[1] / halfV);
    const k = Math.max(1, fitDist / v.pos.distanceTo(v.look));
    v.pos.sub(v.look).multiplyScalar(k).add(v.look);

    // …then fly in until the screen fills the view.
    if (p.dive > 0 && screenRef.current) {
      if (!diveFrom.current) diveFrom.current = { pos: v.pos.clone(), look: v.look.clone() };
      const s = screenRef.current;
      const center = s.getWorldPosition(v.center);
      s.getWorldQuaternion(v.q);
      v.normal.set(0, 0, 1).applyQuaternion(v.q);
      const fitH = spec.screen.h / 2 / halfV;
      const fitW = spec.screen.w / 2 / (halfV * aspect);
      // Similar shapes: cover the viewport. Very different shapes: fit the whole
      // screen so nothing is cropped (the surround matches the page background).
      const ratio = aspect / (spec.screen.w / spec.screen.h);
      const dist = ratio > 0.8 && ratio < 1.25 ? Math.min(fitH, fitW) * 0.97 : Math.max(fitH, fitW) * 1.02;
      const target = v.target.copy(center).addScaledVector(v.normal, dist);
      const t = easeInOut(p.dive);
      v.pos.lerpVectors(diveFrom.current.pos, target, t);
      v.look.lerpVectors(diveFrom.current.look, center, t);
    } else {
      diveFrom.current = null;
    }
    camera.position.copy(v.pos);
    camera.lookAt(v.look);
  });

  return (
    <group ref={wrapper}>
      <Model progress={progress} screenTex={screen.tex} screenRef={screenRef} />
    </group>
  );
}

/** Pre-blurred floor shadow: a single textured plane instead of a per-frame shadow pass. */
function FloorShadow() {
  const tex = useMemo(() => createShadowTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={[0, -0.005, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5.4, 3.6]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

/** Full-screen canvas: the chosen device, studio lighting, optional floor shadow. */
export default function DeviceScene({
  device,
  progress,
  onReady,
}: {
  device: DeviceKind;
  progress: RefObject<IntroProgress>;
  onReady: () => void;
}) {
  const { spec } = DEVICES[device];
  const lowPower = useMemo(() => window.matchMedia("(max-width: 768px)").matches, []);
  // Pixel ratio is the biggest cost on retina screens: cap it, and drop to 1 if frames suffer.
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  return (
    <Canvas
      camera={{ position: spec.cam.closed, fov: spec.fov, near: 0.05, far: 40 }}
      dpr={dpr}
      gl={{ antialias: !lowPower, alpha: true, stencil: false, powerPreference: "high-performance" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={1} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={1.4} />
      {/* Rendered once into a small cube map — no per-frame cost. */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 5, 2]} scale={[8, 2, 1]} rotation={[Math.PI / 2, 0, 0]} />
        <Lightformer form="rect" intensity={1.5} position={[-5, 2, 1]} scale={[2, 6, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={1.5} position={[5, 2, 1]} scale={[2, 6, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="ring" intensity={0.8} position={[0, 1, -6]} scale={4} />
        {/* Back light so dark edges catch a rim highlight. */}
        <Lightformer form="rect" intensity={1.2} position={[0, 0, -5]} scale={[6, 4, 1]} />
        {spec.frontLights && (
          <>
            {/* Product-shot strip lights in front: long highlights down black glass and metal. */}
            <Lightformer form="rect" intensity={2.6} position={[-3.5, 0.5, 5]} scale={[1.2, 9, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={1.8} position={[3.8, 0.5, 4.5]} scale={[0.8, 9, 1]} target={[0, 0, 0]} />
            <Lightformer form="rect" intensity={0.9} position={[0, 4, 6]} scale={[6, 1.5, 1]} target={[0, 0, 0]} />
          </>
        )}
      </Environment>
      <Rig kind={device} progress={progress} onReady={onReady} lowPower={lowPower} />
      {spec.shadow && <FloorShadow />}
    </Canvas>
  );
}

"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { pointCanvasAt, Quiet, ROBOT_POSTER, ROBOT_SCENE, Spline, SPLINE_WASM, useSplineRobot } from "./spline";

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

let webgl: boolean | undefined;
/**
 * Only phones/tablets that can comfortably afford the live 3D robot get it:
 * no data saver, no slow connection, enough memory and cores, WebGL, motion OK.
 * (iOS exposes none of the network/memory hints, so iPhones and iPads qualify.)
 */
function canRun3D() {
  const nav = navigator as NavigatorHints;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (/(^|-)2g|3g/.test(nav.connection?.effectiveType ?? "")) return false;
  if (nav.deviceMemory && nav.deviceMemory < 4) return false;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return false;
  if (webgl === undefined) {
    try {
      webgl = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

const noSubscribe = () => () => {};
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

type IOSOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };

/**
 * Phone / tablet robot, used as a full-bleed hero background:
 * 1. a still of the NEXBOT robot shows immediately (tiny, gently "breathing",
 *    a light sweep across it, parallax with device tilt);
 * 2. capable devices then load the live 3D robot and cross-fade to it — it
 *    looks where you tilt the phone and where you touch.
 */
export function MobileRobot({ active, className = "" }: { active: boolean; className?: string }) {
  const capable = useSyncExternalStore(noSubscribe, canRun3D, () => false);
  const { box, stage, mounted, loaded, visible, onLoad } = useSplineRobot(active && capable, 1.25, true);
  const poster = useRef<HTMLDivElement>(null);

  // Device tilt and taps: parallax for the still, gaze direction for the live robot.
  useEffect(() => {
    if (!visible) return;
    const tilt = { x: 0, y: 0 };
    let raf = 0;
    const canvas = () => (loaded ? stage.current?.querySelector("canvas") ?? null : null);
    const apply = () => {
      raf = 0;
      if (poster.current) poster.current.style.translate = `${tilt.x * -10}px ${tilt.y * -8}px`;
      const c = canvas();
      if (c) {
        const r = c.getBoundingClientRect();
        pointCanvasAt(c, r.left + r.width * (0.5 + tilt.x * 0.5), r.top + r.height * (0.3 + tilt.y * 0.4));
      }
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tilt.x = clamp(e.gamma / 25);
      tilt.y = clamp((e.beta - 50) / 25);
      if (!raf) raf = requestAnimationFrame(apply);
    };
    let asked = false;
    const onDown = (e: PointerEvent) => {
      // iOS only allows the tilt permission prompt from a user gesture.
      if (!asked) {
        asked = true;
        (window.DeviceOrientationEvent as IOSOrientation | undefined)?.requestPermission?.().catch(() => {});
      }
      const c = canvas();
      if (c) pointCanvasAt(c, e.clientX, e.clientY, e); // look at the tap
    };
    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [visible, loaded, stage]);

  return (
    <div ref={box} className={`pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Still: shown first, and kept on devices that skip the live robot */}
      <div
        ref={poster}
        className={`absolute inset-0 transition-[opacity,translate] duration-[1200ms] ease-out ${loaded ? "opacity-0" : "opacity-100"}`}
      >
        {/* Full width from the top, like the live canvas, so the cross-fade lines up */}
        <div className="absolute inset-0">
          <picture>
            {/* Laptops never show this (the page is server-rendered before the width is known): 1×1 blank, no request */}
            <source media="(min-width: 1024px)" srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
            <source media="(min-width: 640px)" srcSet={ROBOT_POSTER.tablet} />
            <img
              src={ROBOT_POSTER.phone}
              alt=""
              // The still is cropped at the waist: fade its bottom edge so there's no hard line.
              className="absolute inset-x-0 top-0 h-auto w-full [mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
              fetchPriority="high"
            />
          </picture>
          {/* Silver light sweeping across the robot only (masked by the same still) */}
          <div
            data-inview-anim
            className="robot-mask absolute inset-0 mix-blend-screen motion-safe:animate-[robot-sweep_6s_ease-in-out_infinite]"
            style={{
              backgroundImage: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
              backgroundSize: "300% 100%",
            }}
          />
        </div>
      </div>

      {/* Live robot (capable devices only) */}
      {mounted && (
        <Quiet>
          <div
            ref={stage}
            className={`absolute inset-0 transition-opacity duration-[1200ms] ${loaded ? "opacity-100" : "opacity-0"}`}
          >
            <Spline scene={ROBOT_SCENE} wasmPath={SPLINE_WASM} onLoad={onLoad} className="h-full w-full" />
          </div>
        </Quiet>
      )}
    </div>
  );
}

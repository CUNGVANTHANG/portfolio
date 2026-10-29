"use client";

import type { Application } from "@splinetool/runtime";
import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * "NEXBOT – robot character concept" by aximoris (Spline Community, CC BY 4.0),
 * as published with the "Spline Scene" component on 21st.dev. Self-hosted with
 * the runtime's WebAssembly modules (copied to /public/spline on install by
 * scripts/copy-spline-wasm.mjs) so nothing depends on external links.
 */
export const ROBOT_SCENE = "/models/robot.splinecode";
export const SPLINE_WASM = "/spline";
/**
 * Stills of the same robot (transparent, top 62% of the frame), captured at real
 * phone / tablet pixel sizes so they line up with the live scene's framing.
 */
export const ROBOT_POSTER = { phone: "/models/robot-poster-phone.webp", tablet: "/models/robot-poster-tablet.webp" };

export const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });

/** If the runtime or scene fails (offline, unsupported), just render nothing. */
export class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Warm the Spline JS chunk without rendering anything. (The scene file itself is
 * left to Spline: a separate fetch() of it was not reused and doubled the download.)
 */
export function prefetchSpline() {
  void import("@splinetool/react-spline");
}

/**
 * Spline renders at the pixel ratio baked into the scene's publish settings,
 * which on retina screens means a huge canvas. Cap it like the rest of the
 * site's WebGL. Uses the runtime's internal renderer, so it's fully guarded.
 */
function capPixelRatio(app: Application, max: number) {
  const renderer = (app as unknown as { _renderer?: { setPixelRatio?: (r: number) => void } })._renderer;
  try {
    renderer?.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, max));
    // Spline only re-frames the camera on resize: do it now, before the first
    // visible frame, or the robot briefly shows at the old (zoomed) framing.
    window.dispatchEvent(new Event("resize"));
  } catch {
    /* internal API changed: keep Spline's default */
  }
}

/** Last time the pointer moved anywhere on the page (drives the robot's frame rate). */
let lastPointer = 0;
if (typeof window !== "undefined") {
  window.addEventListener("pointermove", () => (lastPointer = performance.now()), { passive: true });
}

/**
 * Pause / resume drawing frames without touching the scene's state.
 * (Spline's own stop()/play() also restarts the scene's events, which replays
 * the opening camera pull-back every time the hero scrolls back into view.)
 * While drawing, frames are full rate for 2 s after the pointer moves (the robot
 * is tracking it) and ~30 fps otherwise: its idle motion reads the same at half
 * the GPU/CPU cost.
 * Falls back to stop()/play() if the internal renderer API isn't there.
 */
function setRendering(app: Application, on: boolean) {
  const internal = app as unknown as {
    _renderer?: { setAnimationLoop?: (cb: ((t: number) => void) | null) => void };
    render?: (t: number) => void;
  };
  const loop = internal._renderer?.setAnimationLoop;
  if (loop && typeof internal.render === "function") {
    const render = internal.render;
    let last = 0;
    const frame = (t: number) => {
      const tracking = performance.now() - lastPointer < 2000;
      if (!tracking && t - last < 30) return;
      last = t;
      render.call(internal, t);
    };
    internal._renderer!.setAnimationLoop!(on ? frame : null);
    return;
  }
  if (on && app.isStopped) app.play();
  else if (!on && !app.isStopped) app.stop();
}

/** Sends a synthetic pointer move to the Spline canvas (which only listens on itself). */
export function pointCanvasAt(canvas: HTMLCanvasElement, clientX: number, clientY: number, from?: PointerEvent) {
  canvas.dispatchEvent(
    new PointerEvent("pointermove", {
      clientX,
      clientY,
      screenX: from?.screenX ?? clientX,
      screenY: from?.screenY ?? clientY,
      pointerId: from?.pointerId ?? 1,
      pointerType: from?.pointerType ?? "mouse",
      isPrimary: true,
      bubbles: false, // must never reach the window listener that forwards moves
    })
  );
}

/**
 * Lifecycle shared by every robot instance:
 * - mounts the scene when `active` and the browser is idle (after the hero copy animates);
 * - caps the pixel ratio once loaded;
 * - pauses rendering while off-screen;
 * - forwards every pointer move on the page to the click-through canvas so the
 *   robot looks toward the cursor / finger wherever it is.
 */
export function useSplineRobot(active: boolean, maxPixelRatio: number, waitForCameraSettle = false) {
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(true);
  // The renderer (WebGPU in Chrome) errors on a 0×N drawing buffer, which a
  // collapsed or hidden container would give it. Only draw while it has a size.
  const [sized, setSized] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const app = useRef<Application | null>(null);
  // Bumped on every load: React's dev Strict Mode mounts the scene twice, and the
  // pause / frame-rate control must follow the instance that's actually drawing.
  const [appVersion, setAppVersion] = useState(0);

  useEffect(() => {
    if (!active || !sized) {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
      idle(prefetchSpline);
      return;
    }
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1500 })
      : window.setTimeout(() => setMounted(true), 800);
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, [active, sized]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    const ro = new ResizeObserver(([e]) => setSized(e.contentRect.width >= 2 && e.contentRect.height >= 2));
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const a = app.current;
    if (a && loaded) setRendering(a, visible && sized);
  }, [visible, sized, loaded, appVersion]);

  useEffect(() => {
    if (!loaded || !visible) return;
    const canvas = stage.current?.querySelector("canvas");
    if (!canvas) return;
    const forward = (e: PointerEvent) => pointCanvasAt(canvas, e.clientX, e.clientY, e);
    window.addEventListener("pointermove", forward, { passive: true });
    return () => window.removeEventListener("pointermove", forward);
  }, [loaded, visible]);

  /*
   * The scene opens with a camera pull-back (close-up of the head → full
   * framing, ~1.5 s). With `waitForCameraSettle`, the robot is revealed only
   * once the camera has moved and come to rest, so cross-fading from a still
   * never flashes the close-up. Without it, the pull-back plays visibly.
   */
  const onLoad = (a: Application) => {
    app.current = a;
    setAppVersion((v) => v + 1);
    capPixelRatio(a, maxPixelRatio);
    if (!waitForCameraSettle) return setLoaded(true);
    // `type` exists at runtime but isn't in Spline's published typings.
    const findCamera = () =>
      a.getAllObjects().find((o) => /Camera$/.test((o as unknown as { type?: string }).type ?? ""));
    const started = performance.now();
    let first: number | undefined;
    let last = 0;
    let still = 0;
    const check = () => {
      // Scene objects can appear a moment after onLoad: keep looking.
      const cam = findCamera();
      if (!cam) {
        if (performance.now() - started > 12000) setLoaded(true);
        else window.setTimeout(check, 100);
        return;
      }
      const z = cam.position.z;
      if (first === undefined) first = last = z;
      still = Math.abs(z - last) < 0.5 ? still + 1 : 0;
      last = z;
      const moved = Math.abs(z - first) > 5;
      const elapsed = performance.now() - started;
      // Resting for 0.6 s (a busy main thread can stall the tween for a few frames).
      if ((moved && still >= 6) || elapsed > 12000) setLoaded(true);
      else window.setTimeout(check, 100);
    };
    window.setTimeout(check, 100);
  };

  return { box, stage, mounted, loaded, visible, onLoad };
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "@/lib/gsap";
import { useSmoothScroll } from "../providers/SmoothScroll";
import { pickDevice, type DeviceKind, type IntroProgress } from "./types";

const DeviceScene = dynamic(() => import("./DeviceScene"), { ssr: false });

type Props = {
  skipLabel?: string;
  /**
   * When to play: "first-visit" (once per browser), "session" (once per tab session)
   * or "always" (e.g. for previews).
   */
  once?: "first-visit" | "session" | "always";
  /** Which device to show; "auto" picks phone / tablet / laptop from the viewport. */
  device?: "auto" | DeviceKind;
  onDone?: () => void;
};

const KEY = "device-intro-seen";

function storage(once: Props["once"]) {
  try {
    return once === "first-visit" ? localStorage : once === "session" ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** "play" or "skip", decided from storage, motion preference and WebGL support. */
function decide(once: Props["once"]) {
  const seen = storage(once)?.getItem(KEY) === "1";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return seen || reduce || !hasWebGL() ? "skip" : "play";
}

const noSubscribe = () => () => {};

let webgl: boolean | undefined;
function hasWebGL() {
  // Cached: probing creates a GL context, and browsers cap how many may exist.
  if (webgl === undefined) {
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/**
 * Intro: a device matching the visitor's screen (phone, tablet or laptop) is
 * revealed, boots (loading bar, then a dark screen), and the camera dives into
 * its screen, which dissolves into the page. ~4.3s, skippable.
 */
export function DeviceIntro({
  skipLabel = "Skip",
  once = "first-visit",
  device = "auto",
  onDone,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const skipBtn = useRef<HTMLButtonElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const progress = useRef<IntroProgress>({ open: 0, boot: 0, dive: 0 });
  // Chosen once per intro (the scene only renders on the client).
  const [kind] = useState<DeviceKind>(() =>
    device !== "auto" ? device : typeof window === "undefined" ? "laptop" : pickDevice(window.innerWidth, window.innerHeight)
  );
  const tl = useRef<gsap.core.Timeline | null>(null);
  // Server render: "pending" (overlay only); the client then decides once.
  const decision = useSyncExternalStore(noSubscribe, () => decide(once), () => "pending" as const);
  const [gone, setGone] = useState(false);
  const { setLocked } = useSmoothScroll();
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const finished = useRef(false);
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    document.documentElement.classList.remove("intro-active");
    setLocked(false);
    done.current?.();
  }, [setLocked]);

  useEffect(() => {
    if (decision === "skip") finish();
    else if (decision === "play") {
      setLocked(true);
      // Hide the page under the intro so the browser isn't painting it every frame.
      document.documentElement.classList.add("intro-active");
    }
    return () => document.documentElement.classList.remove("intro-active");
  }, [decision, finish, setLocked]);

  // The 3D scene reports ready (fonts loaded, first frame) → run the timeline.
  const start = useCallback(() => {
    if (tl.current) return;
    const p = progress.current;
    const t = gsap.timeline({
      onComplete: () => {
        // Marked seen only at the very end so the fade-out isn't cut short.
        storage(once)?.setItem(KEY, "1");
        setGone(true);
      },
    });
    tl.current = t;
    t.to(loader.current, { autoAlpha: 0, duration: 0.3 }, 0)
      .fromTo(canvasWrap.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7, ease: "power2.out" }, 0)
      .to(p, { open: 1, duration: 1.5, ease: "none" }, 0.45)
      .to(p, { boot: 1, duration: 1.5, ease: "none" }, 1.15)
      .addLabel("dive", 2.85)
      .to(p, { dive: 1, duration: 1.25, ease: "none" }, "dive")
      .addLabel("out", "dive+=0.95")
      .call(finish, undefined, "out")
      .to(root.current, { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, "out")
      .to(skipBtn.current, { autoAlpha: 0, duration: 0.3 }, "dive");
  }, [finish, once]);

  // Unmounted mid-intro (e.g. navigating away): never leave the page locked or hidden.
  // This must not mark the intro as finished: React's dev Strict Mode unmounts and
  // remounts once on purpose, and the real finish still has to notify the page.
  useEffect(
    () => () => {
      tl.current?.kill();
      tl.current = null;
      if (!finished.current) {
        document.documentElement.classList.remove("intro-active");
        setLocked(false);
      }
    },
    [setLocked]
  );

  const skip = useCallback(() => {
    const t = tl.current;
    if (t && t.time() < t.labels.out) t.seek(t.labels.out - 0.001);
    else if (!t) {
      // Scene not ready yet: leave immediately.
      storage(once)?.setItem(KEY, "1");
      finish();
      setGone(true);
    }
  }, [finish, once]);

  // Escape skips, like closing any overlay.
  useEffect(() => {
    if (decision !== "play") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decision, skip]);

  if (gone || decision === "skip") return null;

  return (
    <div ref={root} className="device-intro fixed inset-0 z-[100] bg-bg glow-top" role="presentation">
      {/* Shown while the 3D scene loads and compiles. */}
      <div ref={loader} className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 overflow-hidden bg-white/10" aria-hidden>
        <div className="h-full w-1/3 animate-[intro-load_1.1s_ease-in-out_infinite] bg-white/70" />
      </div>
      {decision === "play" && (
        <div ref={canvasWrap} className="invisible absolute inset-0">
          <DeviceScene
            device={kind}
            progress={progress}
            onReady={start}
          />
        </div>
      )}
      <button
        ref={skipBtn}
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-5 rounded-full border border-white/20 px-4 py-1.5 text-xs text-fg-2 transition hover:border-white/50 hover:text-fg sm:right-8"
      >
        {skipLabel}
      </button>
    </div>
  );
}

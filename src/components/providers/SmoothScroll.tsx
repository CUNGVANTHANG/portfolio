"use client";

import Lenis from "lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

type ScrollTarget = string | number | HTMLElement;

export type SmoothScrollApi = {
  lenis: RefObject<Lenis | null>;
  /** Scroll to an element id (with or without `#`), an element, or a pixel offset. */
  scrollTo: (target: ScrollTarget, opts?: { duration?: number; immediate?: boolean }) => void;
  /** Lock / unlock page scrolling, e.g. while an intro or modal is open. */
  setLocked: (locked: boolean) => void;
};

const Ctx = createContext<SmoothScrollApi | null>(null);

const resolve = (target: ScrollTarget) =>
  typeof target === "string" ? (target.startsWith("#") ? target : `#${target}`) : target;

/** Native fallback so kit components still work without a provider. */
const nativeApi: SmoothScrollApi = {
  lenis: { current: null },
  scrollTo: (target, opts) => {
    const behavior = opts?.immediate ? "instant" : "smooth";
    if (typeof target === "number") return window.scrollTo({ top: target, behavior });
    const el = typeof target === "string" ? document.querySelector(resolve(target) as string) : target;
    el?.scrollIntoView({ behavior });
  },
  setLocked: (locked) => document.documentElement.classList.toggle("scroll-lock", locked),
};

export function useSmoothScroll(): SmoothScrollApi {
  return useContext(Ctx) ?? nativeApi;
}

/**
 * Lenis smooth scrolling driven by GSAP's ticker, so ScrollTrigger stays in sync.
 * Falls back to native scrolling for users who prefer reduced motion.
 */
export function SmoothScroll({ children, lerp = 0.09 }: { children: ReactNode; lerp?: number }) {
  const lenis = useRef<Lenis | null>(null);
  // Children may lock scrolling before Lenis exists (their effects run first).
  const locked = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instance = new Lenis({ autoRaf: false, lerp: reduce ? 1 : lerp });
    lenis.current = instance;
    if (locked.current) instance.stop();
    instance.on("scroll", ScrollTrigger.update);
    // GSAP's default lag smoothing is kept on purpose: if the main thread stalls
    // (e.g. shader compilation), timelines pause instead of skipping ahead.
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    // Fonts change line heights, so pinned sections need fresh measurements.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis.current = null;
    };
  }, [lerp]);

  const scrollTo = useCallback<SmoothScrollApi["scrollTo"]>((target, opts) => {
    if (!lenis.current) return nativeApi.scrollTo(target, opts);
    lenis.current.scrollTo(resolve(target), { duration: opts?.duration ?? 1.6, immediate: opts?.immediate });
  }, []);

  const setLocked = useCallback((lock: boolean) => {
    locked.current = lock;
    if (lock) lenis.current?.stop();
    else lenis.current?.start();
    nativeApi.setLocked(lock);
    if (!lock) ScrollTrigger.refresh();
  }, []);

  const api = useMemo(() => ({ lenis, scrollTo, setLocked }), [scrollTo, setLocked]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";

export type Entrance = { anim: gsap.core.Animation; revert?: () => void };

/**
 * Shared trigger logic for entrance animations.
 *
 * - `play` undefined → plays once when the element scrolls into view.
 * - `play` boolean   → plays when it becomes true (e.g. after an intro).
 *
 * `make` builds a paused animation; it is skipped entirely for users who
 * prefer reduced motion, so the server-rendered content stays visible.
 */
export function useEntrance<T extends HTMLElement>(
  ref: RefObject<T | null>,
  make: (el: T) => Entrance,
  { play, start = "top 85%" }: { play?: boolean; start?: string } = {}
) {
  const anim = useRef<gsap.core.Animation | null>(null);
  const manual = play !== undefined;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const built = make(el);
        built.anim.pause();
        anim.current = built.anim;
        if (!manual) {
          // No `once`: a once-trigger already passed at creation (page reloaded mid-scroll)
          // kills itself while ScrollTrigger is still looping over its list, which crashes
          // it. play() on a finished animation does nothing, so re-entering is harmless.
          ScrollTrigger.create({ trigger: el, start, onEnter: () => built.anim.play() });
        }
        return () => {
          anim.current = null;
          built.revert?.();
        };
      });
    },
    // `make` is intentionally excluded: it is usually an inline closure.
    { scope: ref, dependencies: [manual, start] }
  );

  useEffect(() => {
    if (play) anim.current?.play();
  }, [play]);
}

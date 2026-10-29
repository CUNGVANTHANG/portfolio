"use client";

import { useRef } from "react";
import { gsap, MQ, useGSAP } from "@/lib/gsap";

/** A silver hairline across the top of the window that fills as you read down the page. */
export function ReadingProgress({ visible }: { visible: boolean }) {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        bar.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 } }
      );
    });
  });

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-px transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-white/20 via-[#d6d9de] to-white motion-reduce:hidden" />
    </div>
  );
}

"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { gsap } from "@/lib/gsap";
import { useSmoothScroll } from "../providers/SmoothScroll";

/**
 * Full-screen overlay showing one item large. Escape, the close button or a
 * click outside the panel closes it; page scrolling is paused while it's open.
 * The panel scrolls on its own if its content is taller than the screen.
 * Rendered into <body> so no section's stacking context can trap it under the nav.
 */
export function Lightbox({
  label,
  closeLabel,
  onClose,
  className = "",
  style,
  children,
}: {
  label: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { setLocked } = useSmoothScroll();
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    setLocked(true);
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    gsap.fromTo(panel.current, { autoAlpha: 0, scale: 0.96, y: 16 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: "power3.out" });
    return () => {
      window.removeEventListener("keydown", onKey);
      setLocked(false);
    };
  }, [setLocked]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={() => close.current()}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-5 sm:p-10"
    >
      <button
        ref={closeBtn}
        type="button"
        onClick={() => close.current()}
        className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-full border border-white/20 bg-bg/60 text-fg transition hover:border-white/50 sm:right-8 sm:top-8"
      >
        <span className="sr-only">{closeLabel}</span>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4" aria-hidden>
          <path d="M3.5 3.5l9 9m0-9l-9 9" strokeLinecap="round" />
        </svg>
      </button>
      <div ref={panel} data-lenis-prevent onClick={(e) => e.stopPropagation()} className={className} style={style}>
        {children}
      </div>
    </div>,
    document.body
  );
}

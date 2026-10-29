"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap, MQ, ScrollTrigger } from "@/lib/gsap";
import { useSmoothScroll } from "../providers/SmoothScroll";

/**
 * "Show more" for long grids: the first `limit` items show, the rest wait behind
 * a button. Expanding fades the newly shown items in; collapsing scrolls back to
 * `sectionId` so the reader isn't left far below the shortened list.
 * Items to hide are marked by the caller with `hidden={!isShown(i)}`.
 */
export function useShowMore(count: number, limit: number, sectionId: string, list: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const prev = useRef(open);

  useEffect(() => {
    if (prev.current === open) return;
    prev.current = open;
    // Layout changed: every ScrollTrigger below must re-measure.
    ScrollTrigger.refresh();
    if (!open || !list.current || !window.matchMedia(MQ.motion).matches) return;
    const extra = Array.from(list.current.children).slice(limit);
    gsap.fromTo(extra, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
  }, [open, limit, list]);

  return {
    isShown: (i: number) => open || i < limit,
    hasMore: count > limit,
    open,
    hidden: count - limit,
    toggle: () => {
      if (open) scrollTo(sectionId, { duration: 1 });
      setOpen((o) => !o);
    },
  };
}

/** Centered outline button with a chevron that flips when expanded. */
export function ShowMoreButton({ open, onClick, more, less }: { open: boolean; onClick: () => void; more: string; less: string }) {
  return (
    <div className="mt-12 flex justify-center sm:mt-14">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className="group inline-flex items-center gap-2.5 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-fg transition hover:border-white/50"
      >
        {open ? less : more}
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className={`size-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M4 6.25 8 10.25l4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

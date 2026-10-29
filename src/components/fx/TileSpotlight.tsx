"use client";

import type { PointerEvent } from "react";

/**
 * Soft light that follows the cursor over a tile. Spread `spotlightHandlers` on
 * the tile (which must be `relative group`) and render <TileSpotlight /> inside it.
 * Only CSS variables change on move, so it costs a repaint of the tile at most.
 */
export const spotlightHandlers = {
  onPointerMove: (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  },
};

export function TileSpotlight() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 [background:radial-gradient(320px_circle_at_var(--mx,50%)_var(--my,50%),rgb(255_255_255/0.16),transparent_65%)] group-hover:opacity-100"
    />
  );
}

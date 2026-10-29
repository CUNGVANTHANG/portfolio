"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { getTechIcon } from "@/lib/techIcons";

/**
 * A row of technology logos in their brand colors. Hovering a logo (not the
 * row's empty space) lifts it with a soft glow, dims its neighbours and shows a
 * tooltip with the name.
 * On touch screens a tap toggles the tooltip.
 */
export function TechLogos({ items, size = "md" }: { items: string[]; size?: "sm" | "md" | "lg" }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);

  // Tap outside closes the tooltip on touch screens.
  useEffect(() => {
    if (!active) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [active]);

  const box = { sm: "size-8", md: "size-12 sm:size-14", lg: "size-16 sm:size-[4.5rem]" }[size];
  const glyph = { sm: "size-5", md: "size-6 sm:size-7", lg: "size-8 sm:size-9" }[size];
  const mono = size === "sm" ? "text-[11px]" : "text-sm sm:text-base";

  return (
    <ul ref={root} className={`group/logos flex flex-wrap ${size === "sm" ? "gap-1.5" : "gap-2 sm:gap-3"}`}>
      {items.map((name) => {
        const icon = getTechIcon(name);
        const on = active === name;
        return (
          <li key={name} className="relative">
            <button
              type="button"
              aria-label={name}
              onClick={() => setActive(on ? null : name)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
              data-on={on || undefined}
              style={{ "--brand": icon.color } as CSSProperties}
              className={`peer relative flex ${box} items-center justify-center rounded-xl text-[var(--brand)] transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.19,1,0.22,1)]
                group-has-[button:hover]/logos:opacity-45 hover:!opacity-100 hover:-translate-y-1 hover:scale-110 hover:[filter:drop-shadow(0_6px_18px_color-mix(in_srgb,var(--brand)_45%,transparent))]
                focus-visible:-translate-y-1 focus-visible:scale-110 focus-visible:outline-none
                data-[on]:-translate-y-1 data-[on]:scale-110 data-[on]:!opacity-100`}
            >
              {icon.kind === "svg" ? (
                <svg data-tech-glyph viewBox="0 0 24 24" className={glyph} fill="currentColor" aria-hidden>
                  <path d={icon.path} />
                </svg>
              ) : (
                <span data-tech-glyph className={`font-display font-bold tracking-tight ${mono}`} aria-hidden>
                  {icon.label}
                </span>
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/10 bg-[#1b1c20] px-2.5 py-1.5 text-xs font-medium text-fg opacity-0 shadow-lg shadow-black/40 transition duration-200
                peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100 peer-data-[on]:translate-y-0 peer-data-[on]:opacity-100"
            >
              {name}
              <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1b1c20]" />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

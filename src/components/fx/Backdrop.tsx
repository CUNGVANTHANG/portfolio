import type { CSSProperties } from "react";
import { HeroDust } from "./HeroDust";

type Glow = {
  /** Centre, as CSS lengths relative to the section (e.g. "80%", "40%"). */
  x: string;
  y: string;
  /** Size of the soft ellipse. */
  w: string;
  h: string;
  /** Peak opacity of the silver mist (default 0.07). */
  o?: number;
};

const PATTERNS = {
  grid: {
    backgroundImage:
      "linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
    backgroundSize: "56px 56px",
  },
  dots: {
    backgroundImage: "radial-gradient(circle, rgb(255 255 255 / 0.2) 1px, transparent 1.6px)",
    backgroundSize: "22px 22px",
  },
} satisfies Record<string, CSSProperties>;

/**
 * Quiet section background: soft silver mist, an optional grid / dot pattern,
 * an optional stage-light beam with drifting dust. Everything fades out at the
 * section's top and bottom edges so neighbouring sections still flow into one
 * another, and it sits behind the content (the section must be `isolate`).
 * Static CSS apart from the dust, which pauses itself off-screen.
 */
export function Backdrop({
  glows = [],
  pattern,
  patternMask,
  beam,
  dust = false,
}: {
  glows?: Glow[];
  pattern?: keyof typeof PATTERNS;
  /** Where the pattern shows, as a CSS mask (e.g. a radial gradient). */
  patternMask?: string;
  /** Horizontal position of a light beam falling from the top (e.g. "50%"). */
  beam?: string;
  /** Dust motes floating in the beam. */
  dust?: boolean;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_10%,#000_90%,transparent)]"
    >
      {glows.map((g, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{
            left: g.x,
            top: g.y,
            width: g.w,
            height: g.h,
            background: `radial-gradient(closest-side, rgb(255 255 255 / ${g.o ?? 0.07}), transparent)`,
          }}
        />
      ))}
      {pattern && (
        <div
          className="absolute inset-0"
          style={{ ...PATTERNS[pattern], maskImage: patternMask, WebkitMaskImage: patternMask }}
        />
      )}
      {beam && (
        <div
          className="absolute top-0 h-[85%] w-[70%] -translate-x-1/2"
          style={{ left: beam, background: "radial-gradient(ellipse 45% 100% at 50% 0%, rgb(255 255 255 / 0.11), transparent 72%)" }}
        >
          {dust && (
            <HeroDust
              count={40}
              className="absolute inset-0 h-full w-full [mask-image:radial-gradient(ellipse_45%_90%_at_50%_10%,#000_30%,transparent_80%)]"
            />
          )}
        </div>
      )}
    </div>
  );
}

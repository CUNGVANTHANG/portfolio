"use client";

import { Quiet, ROBOT_SCENE, Spline, SPLINE_WASM, useSplineRobot } from "./spline";

type Props = {
  /** Mount the WebGL scene only when true (e.g. after the intro), so it never competes with it. */
  active: boolean;
  className?: string;
};

/** Desktop robot: full figure beside the hero copy, watching the cursor. */
export function RobotScene({ active, className = "" }: Props) {
  const { box, stage, mounted, loaded, onLoad } = useSplineRobot(active, 1.0);

  return (
    <div ref={box} className={`relative ${className}`}>
      {/* Placeholder while the scene streams in */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        {/* The pulse stops once the robot is in (it would otherwise keep animating under opacity 0) */}
        <div
          className={`size-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)] ${loaded ? "" : "animate-pulse"}`}
        />
      </div>
      {mounted && (
        <Quiet>
          {/*
            The robot scales with the canvas height, and its arms swing out wide, so
            the canvas is kept wider than the robot (centred, overflowing narrow
            columns) and its edges fade out: no hard cut even mid-gesture. Its
            background is transparent and it ignores pointer events, so clicks,
            text selection and scrolling around it are never blocked.
          */}
          <div
            ref={stage}
            className="pointer-events-none absolute left-1/2 top-0 h-svh w-[125svh] -translate-x-1/2 will-change-transform [transform:translateZ(0)] [mask-image:linear-gradient(to_right,transparent,#000_16%,#000_84%,transparent),linear-gradient(to_bottom,#000_72%,transparent)] [mask-composite:intersect]"
          >
            <Spline
              scene={ROBOT_SCENE}
              wasmPath={SPLINE_WASM}
              onLoad={onLoad}
              className={`h-full w-full transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </Quiet>
      )}
    </div>
  );
}

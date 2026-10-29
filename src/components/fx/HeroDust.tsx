"use client";

import { useEffect, useRef } from "react";

/**
 * Silver dust drifting slowly inside a stage-light beam. Plain 2D canvas,
 * ~30 fps, stopped entirely off-screen; static (not rendered) for reduced motion.
 */
export function HeroDust({ count = 70, className = "" }: { count?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0;
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const motes = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.004,
      vy: -0.002 - Math.random() * 0.006,
      tw: Math.random() * Math.PI * 2,
    }));

    // The loop only runs while the canvas is on screen (and the tab is visible).
    let visible = false;
    let raf = 0, last = 0;
    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(canvas);

    const frame = (t: number) => {
      if (!visible || document.hidden) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return;
      const dt = Math.min(0.05, (t - last) / 1000) || 0.033;
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.x += m.vx * dt * 10;
        m.y += m.vy * dt * 10;
        m.tw += dt * 1.5;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        if (m.x < -0.02) m.x = 1.02;
        if (m.x > 1.02) m.x = -0.02;
        const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.tw));
        ctx.fillStyle = `rgba(230,233,240,${a})`;
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", start);
      ro.disconnect();
      io.disconnect();
    };
  }, [count]);

  return <canvas ref={ref} className={`pointer-events-none ${className}`} aria-hidden />;
}

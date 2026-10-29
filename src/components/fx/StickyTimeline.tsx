"use client";

import { useRef } from "react";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { TechLogos } from "./TechLogos";

export type TimelineEntry = {
  year: string;
  title: string;
  place: string;
  period: string;
  description: string;
  location?: string;
  highlights?: string[];
  stack?: string[];
};

/**
 * Each entry's year sits big and sticky on the left while its details scroll
 * past on the right; a hairline draws itself down the middle.
 * A glowing spark rides the tip of the line as you scroll; when it reaches an
 * entry, that entry's node lights up with a ripple; its details rise in one
 * after another.
 */
export function StickyTimeline({ items }: { items: TimelineEntry[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        // Line and spark share one scroll range, so the spark always sits on the
        // line's tip — which is also the 60% line of the viewport.
        const range = { trigger: root.current, start: "top 60%", end: "bottom 60%", scrub: true };
        const spark = root.current?.querySelector<HTMLElement>(".tl-spark");
        gsap.fromTo(".tl-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: range });
        gsap.fromTo(
          ".tl-spark-track",
          { yPercent: 0 },
          {
            yPercent: 100,
            ease: "none",
            scrollTrigger: {
              ...range,
              // Shown only while it is travelling.
              onUpdate: (st) => spark && (spark.style.opacity = st.progress > 0.002 && st.progress < 0.998 ? "1" : "0"),
            },
          }
        );

        const nodes = gsap.utils.toArray<HTMLElement>(".tl-node");
        nodes.forEach((node) => {
          node.dataset.lit = "false";
          const ripple = node.querySelector(".tl-ripple");
          ScrollTrigger.create({
            trigger: node,
            start: "center 60%",
            onEnter: () => {
              node.dataset.lit = "true";
              gsap.fromTo(ripple, { scale: 1, autoAlpha: 0.8 }, { scale: 4, autoAlpha: 0, duration: 0.9, ease: "power2.out" });
            },
            onLeaveBack: () => {
              node.dataset.lit = "false";
            },
          });
        });

        gsap.utils.toArray<HTMLElement>(".tl-item").forEach((el) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%" } });
          // Details rise in one after another.
          tl.from(
            el.querySelectorAll(".tl-body > *:not(ul), .tl-body li"),
            { autoAlpha: 0, y: 22, duration: 0.7, stagger: 0.06, ease: "power3.out" },
            0.1
          );
        });
        // Back to the static look (every node lit) if motion gets reduced.
        return () => nodes.forEach((n) => (n.dataset.lit = "true"));
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative">
      <span className="absolute bottom-0 left-0 top-0 w-px overflow-y-clip bg-line md:left-[38%]" aria-hidden>
        {/* Brightest at the tip, where the spark is */}
        <span className="tl-fill block h-full w-full origin-top bg-gradient-to-b from-white/15 via-white/45 to-white" />
        {/* Full-height track moved by yPercent, so the spark at its top follows the tip with transforms only.
            The line clips vertically (not sideways, so the glow survives): otherwise the pushed-down
            track would add its whole height to the page's scroll length. */}
        <span className="tl-spark-track pointer-events-none absolute inset-0">
          <span className="tl-spark absolute left-1/2 top-0 block size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_10px_4px_rgba(255,255,255,0.75),0_0_36px_10px_rgba(255,255,255,0.2)] transition-opacity duration-300" />
        </span>
      </span>
      {items.map((it) => (
        <div key={it.title + it.period} className="tl-item relative grid gap-4 pb-20 pl-6 last:pb-0 md:grid-cols-[38%_1fr] md:gap-0 md:pl-0">
          {/* Node on the line: level with the period heading on phones, with the period line on wider screens */}
          <span
            data-lit="true"
            aria-hidden
            className="tl-node absolute left-0 top-[0.8rem] z-10 size-2.5 -translate-x-1/2 rounded-full border border-white/30 bg-bg transition-[background-color,border-color,box-shadow] duration-500 data-[lit=true]:border-white data-[lit=true]:bg-white data-[lit=true]:shadow-[0_0_10px_2px_rgba(255,255,255,0.45)] md:left-[38%] md:top-1.5"
          >
            <span className="tl-ripple absolute inset-0 rounded-full border border-white opacity-0" />
          </span>
          <div className="md:pr-10">
            {/* Phones: the whole period is the heading; wider screens: just the big sticky year */}
            <p className="text-silver font-display text-4xl font-semibold leading-none tracking-tight md:sticky md:top-[30vh] md:text-8xl">
              <span className="md:hidden">{it.period}</span>
              <span className="hidden md:inline">{it.year}</span>
            </p>
          </div>
          <div className="tl-body md:pl-10">
            <p className="hidden flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-fg-3 md:flex">
              {it.period}
            </p>
            <h3 className="font-display text-2xl font-semibold sm:text-3xl md:mt-3">{it.title}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-fg-2">
              <span className="inline-flex items-center gap-2">
                <BuildingIcon />
                {it.place}
              </span>
              {it.location && (
                <span className="inline-flex items-center gap-2 text-fg-3">
                  <PinIcon />
                  {it.location}
                </span>
              )}
            </p>
            <p className="mt-4 leading-relaxed text-fg">{it.description}</p>
            {!!it.highlights?.length && (
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-fg-2">
                {it.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-3" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            )}
            {!!it.stack?.length && (
              // Logos sit in padded hit boxes: pull the row left so the first glyph lines up with the text.
              <div className="-ml-1.5 mt-4">
                <TechLogos items={it.stack} size="sm" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const icon = "size-4 shrink-0 text-fg-3";

function BuildingIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={icon} aria-hidden>
      <path d="M2.5 14.5h11M3.5 14.5V2.5h6v12M9.5 6.5h3v8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 5h2M5.5 7.5h2M5.5 10h2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className={icon} aria-hidden>
      <path d="M8 14.5s4.5-4.2 4.5-7.7a4.5 4.5 0 1 0-9 0c0 3.5 4.5 7.7 4.5 7.7Z" strokeLinejoin="round" />
      <circle cx="8" cy="6.8" r="1.6" />
    </svg>
  );
}

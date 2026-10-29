"use client";

import { useRef } from "react";
import { data } from "@/lib/data";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { TechLogos } from "../fx/TechLogos";
import { Backdrop } from "../fx/Backdrop";
import { SectionHeader } from "./SectionHeader";

/**
 * Skills: one row per area (Frontend, Backend, Mobile, AI / ML, DevOps…),
 * name + one-liner on the left, brand-coloured logos with tooltips on the right.
 * No dividers or hover lines: the grid backdrop already draws lines.
 *
 * "QC scan" on the way in: a silver beam sweeps each row's logos; every logo
 * starts grey and flashes into its brand colour as the beam passes.
 */
export function Skills() {
  const { skills } = data;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        let lineFree = 0;
        gsap.utils.toArray<HTMLElement>("[data-skills-row]").forEach((row) => {
          const bay = row.querySelector<HTMLElement>("[data-scan-bay]")!;
          const beam = row.querySelector<HTMLElement>("[data-scan-beam]")!;
          const glyphs = gsap.utils.toArray<HTMLElement>("[data-tech-glyph]", row);
          const grey = "grayscale(1) brightness(0.5)";
          gsap.set(glyphs, { filter: grey });

          const sweep = 1.1;
          const tl = gsap.timeline({ paused: true });
          tl.from(row, { autoAlpha: 0, y: 28, duration: 0.8, ease: "power3.out" })
            .addLabel("scan", 0.35)
            .set(beam, { autoAlpha: 1, x: 0 }, "scan")
            // Linear, so each logo can light up exactly when the beam reaches it.
            .to(beam, { x: () => bay.offsetWidth, duration: sweep, ease: "none" }, "scan")
            .to(beam, { autoAlpha: 0, duration: 0.25 }, `scan+=${sweep - 0.1}`)
            // Park the hidden beam back at the start: left at the far end it would
            // overflow the page once the viewport gets narrower.
            .set(beam, { x: 0 });
          const width = bay.offsetWidth || 1;
          const left = bay.getBoundingClientRect().left;
          glyphs.forEach((g) => {
            const r = g.getBoundingClientRect();
            const at = `scan+=${(((r.left + r.width / 2 - left) / width) * sweep).toFixed(3)}`;
            tl.to(g, { filter: "grayscale(0) brightness(1.8)", duration: 0.1, ease: "none" }, at).to(g, {
              filter: "grayscale(0) brightness(1)",
              duration: 0.45,
              ease: "power2.out",
              clearProps: "filter",
            });
          });

          // Rows that come into view together run one after another, like a production line.
          ScrollTrigger.create({
            trigger: row,
            start: "top 82%",
            onEnter: () => {
              if (tl.progress() > 0 || tl.isActive()) return; // already run (or queued)
              const now = gsap.ticker.time;
              const delay = Math.max(0, lineFree - now);
              lineFree = now + delay + 0.35;
              tl.delay(delay).play();
            },
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="skills" ref={root} className="relative isolate overflow-x-clip px-5 py-24 sm:px-8 lg:py-32">
      <Backdrop
        glows={[{ x: "15%", y: "30%", w: "800px", h: "700px", o: 0.068 }]}
        pattern="grid"
        patternMask="radial-gradient(ellipse 65% 55% at 55% 30%, #000 25%, transparent 80%)"
      />
      <div className="mx-auto max-w-7xl">
        <SectionHeader heading={skills.heading} intro={skills.intro} />

        <ul className="mt-14">
          {skills.groups.map((g, i) => (
            <li
              key={g.name}
              data-skills-row
              className="grid gap-5 py-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-center lg:gap-12"
            >
              <div className="flex gap-5">
                <span className="pt-1.5 font-mono text-xs text-fg-3">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{g.name}</h3>
                  <p className="mt-1.5 text-sm text-fg-2">{g.description}</p>
                </div>
              </div>
              {/* The scan bay: as wide as the logos, so the beam stops at the last one */}
              <div data-scan-bay className="relative w-fit max-w-full pl-10 lg:pl-0">
                <TechLogos items={g.items} size="lg" />
                {/* Beam: a bright line with a faint wash trailing behind it, fading out top and bottom */}
                <span
                  data-scan-beam
                  aria-hidden
                  className="pointer-events-none invisible absolute -inset-y-4 -left-[84px] w-24 [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]"
                >
                  <span className="absolute inset-y-0 left-0 right-3 bg-gradient-to-r from-transparent to-white/[0.08]" />
                  <span className="absolute inset-y-0 right-3 w-px bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.45)]" />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

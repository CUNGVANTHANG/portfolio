"use client";

import Image from "next/image";
import { useRef } from "react";
import { data } from "@/lib/data";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { SectionHeader } from "./SectionHeader";
import { Backdrop } from "../fx/Backdrop";

/** About: a short intro, education and soft skills on the left, a portrait on the right. */
export function About() {
  const { about, profile } = data;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        // Portrait: uncovered bottom → top while it settles from a slight zoom, then its frame slides in.
        const photo = root.current?.querySelector("[data-portrait-photo]");
        gsap
          .timeline({ scrollTrigger: { trigger: "[data-portrait]", start: "top 80%" } })
          .fromTo(photo ?? [], { clipPath: "inset(100% 0% 0% 0% round 1rem)" }, { clipPath: "inset(0% 0% 0% 0% round 1rem)", duration: 1.3, ease: "expo.inOut" })
          .from(photo?.querySelector("img") ?? [], { scale: 1.2, duration: 1.6, ease: "expo.out", clearProps: "transform" }, 0.2)
          .from("[data-portrait-frame]", { x: -16, y: -16, autoAlpha: 0, duration: 0.9, ease: "power3.out", clearProps: "transform" }, 0.9);
        // Soft-skill pills pop in.
        gsap.from("[data-pill]", {
          autoAlpha: 0,
          scale: 0.85,
          duration: 0.5,
          stagger: 0.07,
          ease: "back.out(2)",
          scrollTrigger: { trigger: "[data-pill]", start: "top 90%" },
        });
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el, i) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 24,
            duration: 0.9,
            delay: (i % 4) * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="relative isolate px-5 py-24 sm:px-8 lg:py-32">
      <Backdrop
        glows={[{ x: "82%", y: "45%", w: "900px", h: "760px", o: 0.093 }, { x: "8%", y: "15%", w: "600px", h: "500px", o: 0.051 }]}
        pattern="dots"
        patternMask="radial-gradient(ellipse 38% 45% at 85% 50%, #000, transparent 75%)"
      />
      <div className="mx-auto max-w-7xl">
        <SectionHeader heading={about.heading} />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-20">
          <div>
            <div className="space-y-5 text-lg leading-relaxed text-fg sm:text-xl">
              {about.paragraphs.map((p) => (
                <p key={p} data-reveal>
                  {p}
                </p>
              ))}
            </div>

            {/* Education and soft skills: two blocks side by side, split by a hairline */}
            <dl data-reveal className="mt-10 grid border-t border-line sm:grid-cols-2">
              <div className="py-6 sm:pr-8">
                <dt className={label}>
                  <CapIcon />
                  {about.education.label}
                </dt>
                <dd className="mt-4">
                  <p className="font-display text-lg font-semibold leading-snug tracking-tight">{about.education.school}</p>
                  <p className="mt-1.5 text-sm text-fg-2">{about.education.detail}</p>
                </dd>
              </div>
              <div className="border-t border-line py-6 sm:border-l sm:border-t-0 sm:pl-8">
                <dt className={label}>
                  <PeopleIcon />
                  {about.softSkills.label}
                </dt>
                <dd className="mt-4 flex flex-wrap gap-2">
                  {about.softSkills.items.map((it) => (
                    <span key={it} data-pill className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-fg">
                      {it}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          {/* Portrait: offset silver frame behind; on hover the photo lifts and the frame slides further out */}
          {profile.avatar && (
            <figure data-portrait className="group relative order-first mx-auto w-full max-w-[16rem] pb-4 pr-4 sm:max-w-[18rem] lg:order-none lg:mr-0 lg:mt-2 lg:max-w-[22.5rem]">
              <span
                aria-hidden
                data-portrait-frame
                className="absolute inset-0 left-4 top-4 rounded-2xl border border-white/25 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-2 group-hover:translate-y-2"
              />
              <div data-portrait-photo className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-surface transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-x-1 group-hover:-translate-y-1">
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  fill
                  sizes="(min-width: 1024px) 22.5rem, 18rem"
                  // Just below the hero: load it up front so it isn't decoded mid-scroll.
                  loading="eager"
                  className="object-cover grayscale transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.03]"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent" />
                <span aria-hidden className="media-sheen pointer-events-none absolute inset-0" />
              </div>
            </figure>
          )}
        </div>

      </div>
    </section>
  );
}

const label = "flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-fg-3";
const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "size-4", "aria-hidden": true } as const;

function CapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" strokeLinejoin="round" />
      <path d="M6.5 11v4.5c1.5 1.5 3.5 2.25 5.5 2.25s4-.75 5.5-2.25V11M21.5 9v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" strokeLinecap="round" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 13.6A5.5 5.5 0 0 1 20.5 19" strokeLinecap="round" />
    </svg>
  );
}

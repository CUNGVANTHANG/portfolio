"use client";

import { useEffect, useRef } from "react";
import { data } from "@/lib/data";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { HeroDust } from "../fx/HeroDust";
import { MobileRobot } from "../hero/MobileRobot";
import { RobotScene } from "../hero/RobotScene";
import { useSmoothScroll } from "../providers/SmoothScroll";

/** Original button look; inline-flex + same padding so both sit on one line. */
const cta =
  "group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition";

/** Robot only on screens wide enough for the two-column layout (laptops and up). */
const ROBOT_MIN_WIDTH = "(min-width: 1024px)";

/**
 * Hero.
 * - Laptops and up: name and pitch on the left, the full robot watching the
 *   cursor on the right (copy never overlaps the 3D scene).
 * - Below 1024px: the robot's head and shoulders fill the screen as a
 *   background (still first, live 3D on capable devices) and the copy sits over
 *   a dark scrim on the lower half.
 */
export function Hero({ play }: { play: boolean }) {
  const { profile, hero } = data;
  const root = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const wide = useMediaQuery(ROBOT_MIN_WIDTH);
  const { scrollTo } = useSmoothScroll();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const role =
          root.current?.querySelector<HTMLElement>("[data-hero-role]");
        const roleText = role?.textContent ?? "";
        tl.current = gsap
          .timeline({ paused: true, defaults: { ease: "power3.out" } })
          // Name: uncovered left → right while it sharpens and its tracking settles.
          .fromTo(
            "[data-hero-name]",
            {
              clipPath: "inset(-20% 100% -20% 0%)",
              filter: "blur(10px)",
              letterSpacing: "0.06em",
            },
            {
              clipPath: "inset(-20% 0% -20% 0%)",
              filter: "blur(0px)",
              letterSpacing: "-0.01em",
              duration: 1.4,
              ease: "expo.out",
            },
          )
          // Role: decoded from random characters.
          .from(role ?? [], { autoAlpha: 0, duration: 0.01 }, "-=0.9")
          .to(
            role ?? [],
            {
              duration: 1.1,
              scrambleText: { text: roleText, chars: "01<>/{}#$_", speed: 0.7 },
            },
            "<",
          )
          .from(
            "[data-hero-item]",
            {
              autoAlpha: 0,
              y: 24,
              filter: "blur(6px)",
              duration: 0.9,
              stagger: 0.1,
            },
            "-=0.7",
          )
          .from("[data-hero-hint]", { autoAlpha: 0, duration: 0.8 }, "-=0.2");

        // Leaving the hero: copy and robot drift up and fade; the scroll hint goes first.
        gsap.to("[data-hero-leave]", {
          yPercent: -10,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        gsap.to("[data-hero-hint]", {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "15% top",
            scrub: true,
          },
        });
      });
    },
    { scope: root },
  );

  useEffect(() => {
    if (play) tl.current?.play();
  }, [play]);

  return (
    <section id="hero" ref={root} className="relative overflow-hidden glow-top">
      {/* Smaller screens: robot background + a scrim so the copy stays crisp */}
      {/* Full width (no inner edges to cut the arms), inset a little from the top */}
      {!wide && (
        <div data-hero-leave="" className="absolute inset-0 lg:hidden">
          <MobileRobot
            active={play}
            className="absolute inset-0 translate-y-[4svh] [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] lg:hidden"
          />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-bg via-bg/80 to-transparent lg:hidden"
        aria-hidden
      />

      {/* Laptops and up: stage light falling on the robot */}
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_40%_70%_at_75%_10%,rgba(255,255,255,0.11),transparent_70%)] lg:block"
        aria-hidden
      />
      {/* Dust in the light beam — right half only, never behind the copy */}
      {wide && (
        <HeroDust className="absolute inset-y-0 right-0 w-1/2 [mask-image:radial-gradient(ellipse_70%_75%_at_50%_15%,#000_30%,transparent_80%)]" />
      )}

      <div
        data-hero-leave=""
        className="relative mx-auto grid min-h-svh max-w-7xl items-center px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr]"
      >
        {/* Robot watches the cursor; it never captures clicks, touches or scrolling. */}
        {wide && <RobotScene active={play} className="order-2 h-svh" />}

        {/* Phones/tablets: centred in the screen height, nudged below the robot's head */}
        <div className="order-1 pb-10 pt-[30svh] text-center lg:py-0 lg:text-left">
          <h1
            data-hero-name
            className="text-silver text-balance font-display text-[clamp(2.5rem,4.5vw,4.5rem)] font-semibold leading-[1.04] tracking-tight"
          >
            {profile.name}
          </h1>
          <p
            data-hero-role
            className="mt-5 font-display text-sm font-semibold uppercase tracking-[0.28em] text-fg-2 sm:text-base"
          >
            {profile.role}
          </p>
          <p
            data-hero-item
            className="mx-auto mt-6 max-w-lg text-balance text-lg leading-relaxed text-fg sm:text-xl lg:mx-0 lg:max-w-none lg:text-wrap lg:whitespace-nowrap"
          >
            {/* "\n" in the tagline marks the preferred line break on laptops and up */}
            {profile.tagline.split("\n").map((part, i) => (
              <span key={i}>
                {i > 0 && <br className="hidden lg:block" />}
                {i > 0 && <span className="lg:hidden"> </span>}
                {part}
              </span>
            ))}
          </p>
          {/* Same padding + 1px border on both, so they line up exactly */}
          <div
            data-hero-item
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollTo("about", { duration: 1.4 });
              }}
              className={`${cta} border border-transparent bg-fg text-bg hover:bg-white`}
            >
              {hero.ctaPrimary}
            </a>
            <a
              href={profile.resume}
              download
              className={`${cta} border border-white/25 text-fg hover:border-white/60`}
            >
              {hero.ctaSecondary}
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="size-3.5"
                aria-hidden
              >
                <path
                  d="M8 2.5v8m0 0L4.75 7.25M8 10.5l3.25-3.25M3 13.5h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <button
        type="button"
        data-hero-hint
        onClick={() => scrollTo("about", { duration: 1.4 })}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-fg-3 transition-colors hover:text-fg sm:flex"
      >
        {hero.scrollHint}
        <span
          className="relative h-10 w-px overflow-hidden bg-white/15"
          aria-hidden
        >
          <span data-inview-anim className="absolute inset-x-0 top-0 h-1/2 bg-fg motion-safe:animate-[scroll-hint_1.8s_ease-in-out_infinite]" />
        </span>
      </button>
    </section>
  );
}

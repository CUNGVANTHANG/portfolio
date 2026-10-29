"use client";

import Image from "next/image";
import { useRef } from "react";
import { siFacebook, siGithub } from "simple-icons";
import { data } from "@/lib/data";
import { gsap, MQ, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { CopyEmail } from "../fx/CopyEmail";
import { LineReveal } from "../fx/LineReveal";

/*
 * The hands photo (Tara Winstead, Pexels License) was cut out, toned to
 * graphite/silver and split at the gap between the fingertips into two images.
 * Numbers below are fractions of the full photo width (2400 × 633 crop).
 */
const SPLIT = 1153 / 2400; // where the photo was split = midpoint between the fingertips
const TIP_Y = 0.36; // fingertips' height (human 0.40, robot 0.30)
const ENTER = 0.14; // how far each hand starts out when the section comes in
const NEAR = 0.025; // each hand's reach while a contact link is hovered
const TOUCH = 0.051; // each hand's reach to touch (fingertips are 0.105 apart)

/**
 * Contact: the closing scene. A human hand and a robot hand reach toward each
 * other ("let's build something together"). They glide in when the section
 * appears, lean closer while a contact link (email or a social) is hovered, and
 * touch with a spark of light when one is clicked (the email gets copied).
 */
export function Contact() {
  const { contact, profile } = data;
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const motion = useRef(false);
  const hovered = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        motion.current = true;
        const w = () => stage.current?.offsetWidth ?? 0;
        gsap.from("[data-contact-reveal]", {
          autoAlpha: 0,
          y: 24,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
        // Hands glide in from the sides.
        const enter = { trigger: stage.current, start: "top 85%" };
        gsap.from("[data-hand=human]", { x: () => -ENTER * w(), autoAlpha: 0, duration: 2.2, ease: "power3.out", scrollTrigger: enter });
        gsap.from("[data-hand=robot]", { x: () => ENTER * w(), autoAlpha: 0, duration: 2.2, ease: "power3.out", scrollTrigger: enter });
        // A slow, out-of-step float so they feel alive — only while the hands are on screen.
        const float = [
          gsap.to("[data-float=human]", { y: 6, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }),
          gsap.to("[data-float=robot]", { y: -6, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true }),
        ];
        ScrollTrigger.create({
          trigger: stage.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (st) => float.forEach((t) => (st.isActive ? t.play() : t.pause())),
        });
        return () => {
          motion.current = false;
        };
      });
    },
    { scope: root }
  );

  /** Moves both hands toward each other by `frac` of the stage width. */
  const reach = (frac: number, duration: number, ease: string) => {
    const w = stage.current?.offsetWidth ?? 0;
    const q = gsap.utils.selector(root);
    gsap.to(q("[data-reach=human]"), { x: frac * w, duration, ease, overwrite: true });
    return gsap.to(q("[data-reach=robot]"), { x: -frac * w, duration, ease, overwrite: true });
  };

  const onHover = (on: boolean) => {
    hovered.current = on;
    if (!motion.current) return;
    reach(on ? NEAR : 0, 0.9, "power3.out");
    gsap.to(root.current!.querySelector("[data-spark-core]"), { autoAlpha: on ? 0.55 : 0, scale: on ? 0.7 : 0.4, duration: 0.6 });
  };

  const touch = () => {
    if (!motion.current) return;
    const q = gsap.utils.selector(root);
    gsap
      .timeline()
      .add(reach(TOUCH, 0.45, "power2.inOut"))
      // Contact: flash + ripple where the fingertips meet.
      .fromTo(q("[data-spark-core]"), { autoAlpha: 1, scale: 1.8 }, { scale: 0.7, autoAlpha: 0.55, duration: 0.8, ease: "power2.out" })
      .fromTo(q("[data-spark-ring]"), { autoAlpha: 0.9, scale: 1 }, { autoAlpha: 0, scale: 9, duration: 1, ease: "power2.out" }, "<")
      .add(() => onHover(hovered.current), "+=0.5");
  };

  return (
    <section id="contact" ref={root} className="relative overflow-hidden px-5 py-28 sm:px-8 lg:py-36">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl text-center">
        <LineReveal
          as="h2"
          className="text-silver mx-auto max-w-4xl text-balance font-display text-[clamp(2.5rem,6.5vw,5.75rem)] font-semibold leading-[1.02] tracking-tight"
        >
          {contact.heading}
        </LineReveal>
        <p data-contact-reveal className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-fg-2">
          {contact.message}
        </p>
      </div>

      {/* The hands: full bleed, wider than the screen on phones so they stay large */}
      <div className="relative -mx-5 mt-12 overflow-hidden sm:-mx-8 lg:mt-16" role="img" aria-label={contact.handsAlt}>
        <div ref={stage} className="relative -ml-[35%] aspect-[2400/633] w-[170%] max-w-none sm:mx-auto sm:w-full sm:max-w-[1500px]">
          <div data-hand="human" className="absolute inset-y-0 left-0" style={{ width: `${SPLIT * 100}%` }}>
            <div data-reach="human" className="h-full">
              <div data-float="human" className="h-full">
                <Image
                  src="/images/hand-human.webp"
                  alt=""
                  width={1153}
                  height={633}
                  sizes="(min-width: 640px) 50vw, 85vw"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            </div>
          </div>
          <div data-hand="robot" className="absolute inset-y-0 right-0" style={{ width: `${(1 - SPLIT) * 100}%` }}>
            <div data-reach="robot" className="h-full">
              <div data-float="robot" className="h-full">
                <Image
                  src="/images/hand-robot.webp"
                  alt=""
                  width={1247}
                  height={633}
                  sizes="(min-width: 640px) 50vw, 85vw"
                  draggable={false}
                  className="h-full w-full select-none object-contain"
                />
              </div>
            </div>
          </div>
          {/* Where the fingertips meet */}
          <span
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${SPLIT * 100}%`, top: `${TIP_Y * 100}%` }}
          >
            <span
              data-spark-ring
              className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white opacity-0"
            />
            <span
              data-spark-core
              className="block size-2.5 scale-[0.4] rounded-full bg-white opacity-0 shadow-[0_0_12px_4px_rgba(255,255,255,0.8),0_0_44px_14px_rgba(255,255,255,0.22)]"
            />
          </span>
        </div>
      </div>

      {/* Email (click to copy) and socials: one row, icon + label, all alike */}
      <div
        data-contact-reveal
        className="relative mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 lg:mt-12"
      >
        <CopyEmail
          email={profile.email}
          copiedLabel={contact.copied}
          onHover={onHover}
          onCopied={touch}
          title={contact.hint}
          className={link}
        >
          <MailIcon />
          <span className="underline-draw break-all">{profile.email}</span>
        </CopyEmail>
        {profile.socials.map((s) => (
          <a
            key={s.label}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className={link}
            onPointerEnter={() => onHover(true)}
            onPointerLeave={() => onHover(false)}
            onFocus={() => onHover(true)}
            onBlur={() => onHover(false)}
            onClick={touch}
          >
            <SocialIcon label={s.label} />
            <span className="underline-draw">{s.label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

const link = "group inline-flex items-center gap-3 text-lg text-fg-2 transition-colors hover:text-fg sm:text-xl";

/** Monochrome brand marks (Simple Icons paths; LinkedIn's is no longer shipped there). */
const SOCIAL_PATHS: Record<string, string> = {
  github: siGithub.path,
  facebook: siFacebook.path,
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-2.247 3.37-2.247 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

function SocialIcon({ label }: { label: string }) {
  const path = SOCIAL_PATHS[label.toLowerCase()];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0 sm:size-[22px]" aria-hidden>
      <path d={path} />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 shrink-0 sm:size-[22px]" aria-hidden>
      <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

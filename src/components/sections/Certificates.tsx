"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { data, type Certificate } from "@/lib/data";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { getTechIcon } from "@/lib/techIcons";
import { Lightbox } from "../fx/Lightbox";
import { spotlightHandlers, TileSpotlight } from "../fx/TileSpotlight";
import { ShowMoreButton, useShowMore } from "../fx/ShowMore";
import { SectionHeader } from "./SectionHeader";
import { Backdrop } from "../fx/Backdrop";

/**
 * Certificates: a grid of certificate images (official badges or scans), each
 * with its name, issuer and year. Clicking an image opens it
 * large in a lightbox (Escape, the close button or a click outside closes it).
 * Without an image, a placeholder certificate is drawn in the site's style.
 */
export function Certificates() {
  const { certificates } = data;
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const more = useShowMore(certificates.items.length, certificates.limit, "certificates", list);
  const [open, setOpen] = useState<Certificate | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        // Tiles rise in; each badge is then "stamped": it lands from a little larger and
        // out of focus, and a silver sheen sweeps across it once.
        const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-cert-grid]", start: "top 80%" } });
        tl.from("[data-cert]", { autoAlpha: 0, y: 40, duration: 0.9, stagger: 0.1, ease: "power3.out" })
          .from(
            "[data-cert] [data-cert-badge]",
            { scale: 1.3, autoAlpha: 0, filter: "blur(8px)", duration: 0.7, stagger: 0.1, ease: "back.out(1.6)", clearProps: "transform,filter" },
            0.25
          )
          .fromTo(
            "[data-cert] .media-sheen",
            { xPercent: -120 },
            { xPercent: 120, duration: 1, stagger: 0.1, ease: "power2.inOut", clearProps: "transform" },
            0.6
          );
      });
    },
    { scope: root }
  );

  return (
    <section id="certificates" ref={root} className="relative isolate px-5 py-24 sm:px-8 lg:py-32">
      <Backdrop beam="50%" dust glows={[{ x: "50%", y: "70%", w: "1200px", h: "700px", o: 0.051 }]} />
      <div className="mx-auto max-w-7xl">
        <SectionHeader heading={certificates.heading} intro={certificates.intro} />

        {/* Phones: a list (thumbnail | text) split by hairlines; wider screens: a grid of large images */}
        <ul ref={list} data-cert-grid className="mt-10 grid border-t border-line sm:mt-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 sm:border-t-0 lg:grid-cols-3">
          {certificates.items.map((c, i) => (
            <li key={c.name} data-cert hidden={!more.isShown(i)} className="flex items-center gap-5 border-b border-line py-5 sm:block sm:border-b-0 sm:py-0">
              <button
                type="button"
                {...spotlightHandlers}
                onClick={() => setOpen(c)}
                aria-label={`${certificates.view}: ${c.name}`}
                className="group relative block aspect-square w-24 shrink-0 overflow-hidden rounded-xl border sm:aspect-[1.414] sm:w-full border-white/10 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
              >
                <CertificateArt cert={c} />
                <TileSpotlight />
                <span aria-hidden className="media-sheen pointer-events-none absolute inset-0" />
              </button>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold leading-snug tracking-tight sm:mt-5 sm:text-lg">{c.name}</h3>
                <p className="mt-1.5 text-sm text-fg-2 sm:mt-2">
                  {c.issuer} <span className="text-fg-3">· {c.year}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
        {more.hasMore && (
          <ShowMoreButton
            open={more.open}
            onClick={more.toggle}
            more={certificates.more.replace("{n}", String(more.hidden))}
            less={certificates.less}
          />
        )}
      </div>

      {open && (
        <Lightbox
          label={open.name}
          closeLabel={certificates.close}
          onClose={() => setOpen(null)}
          className="relative aspect-[1.414] w-full overflow-hidden rounded-xl border border-white/15 shadow-2xl"
          style={{ maxHeight: "85svh", maxWidth: "min(64rem, calc(85svh * 1.414))" }}
        >
          <CertificateArt cert={open} large />
        </Lightbox>
      )}
    </section>
  );
}

/** The certificate image, or a generated placeholder in the site's graphite/silver style. */
function CertificateArt({ cert, large = false }: { cert: Certificate; large?: boolean }) {
  if (cert.image) {
    // Badges and scans are shown whole, centred on a softly lit graphite stage.
    return (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_15%,#2c2e33,#121316_75%)]">
        <div data-cert-badge className={`absolute ${large ? "inset-[8%]" : "inset-[10%]"}`}>
          <Image
            src={cert.image}
            alt={large ? cert.name : ""}
            fill
            sizes={large ? "60vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 80vw"}
            className="object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.04]"
          />
        </div>
      </div>
    );
  }
  const icon = getTechIcon(cert.logo);
  return (
    <div
      style={{ "--brand": icon.color } as CSSProperties}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,#2a2c31,#121316_75%)] px-[8%] text-center"
    >
      {/* Double frame, like a printed certificate */}
      <span aria-hidden className="absolute inset-[4%] rounded-md border border-white/15" />
      <span aria-hidden className="absolute inset-[6%] rounded-sm border border-white/[0.07]" />
      <span className={large ? "text-[var(--brand)]" : "text-fg-3 transition-colors duration-500 group-hover:text-[var(--brand)]"}>
        {icon.kind === "svg" ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className={large ? "size-14" : "size-8"} aria-hidden>
            <path d={icon.path} />
          </svg>
        ) : (
          <span className={`font-display font-bold tracking-tight ${large ? "text-3xl" : "text-lg"}`}>{icon.label}</span>
        )}
      </span>
      <span className={`mt-[4%] font-mono uppercase tracking-[0.3em] text-fg-3 ${large ? "text-sm" : "hidden text-[9px] sm:block"}`}>Certificate</span>
      <span
        className={`text-silver mt-[2%] text-balance font-display font-semibold leading-tight tracking-tight ${large ? "text-[clamp(1.5rem,3.5vw,2.75rem)]" : "hidden text-base sm:block sm:text-lg"}`}
      >
        {cert.name}
      </span>
      <span aria-hidden className={`mt-[4%] h-px bg-white/20 ${large ? "w-32" : "hidden w-14 sm:block"}`} />
      <span className={`mt-[3%] text-fg-2 ${large ? "text-base" : "hidden text-[11px] sm:block"}`}>
        {cert.issuer} · {cert.year}
      </span>
    </div>
  );
}

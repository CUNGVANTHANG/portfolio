"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { data, type Project } from "@/lib/data";
import { gsap, MQ, useGSAP } from "@/lib/gsap";
import { Lightbox } from "../fx/Lightbox";
import { spotlightHandlers, TileSpotlight } from "../fx/TileSpotlight";
import { ShowMoreButton, useShowMore } from "../fx/ShowMore";
import { ProjectCover } from "../fx/ProjectCover";
import { TechLogos } from "../fx/TechLogos";
import { SectionHeader } from "./SectionHeader";
import { Backdrop } from "../fx/Backdrop";

/**
 * Projects: same layout as Certificates — a grid of images on wider screens,
 * a list (thumbnail | text) on phones. Clicking an image opens the project
 * large in a lightbox with its story, results and stack; nothing navigates away.
 */
export function Projects() {
  const { projects, nav } = data;
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const more = useShowMore(projects.items.length, projects.limit, "projects", list);
  const [open, setOpen] = useState<Project | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        // Each image is uncovered left → right while it settles from a slight zoom; its text follows.
        gsap.utils.toArray<HTMLElement>("[data-project]").forEach((item, i) => {
          const media = item.querySelector("button");
          gsap
            .timeline({ delay: (i % 2) * 0.12, scrollTrigger: { trigger: item, start: "top 85%" } })
            .fromTo(media, { clipPath: "inset(0% 100% 0% 0% round 0.75rem)" }, { clipPath: "inset(0% 0% 0% 0% round 0.75rem)", duration: 1.2, ease: "expo.inOut", clearProps: "clipPath" })
            .from(media?.querySelector("img, div") ?? [], { scale: 1.18, duration: 1.5, ease: "expo.out", clearProps: "transform" }, 0.15)
            .from(item.querySelectorAll("h3, p"), { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.08, ease: "power3.out" }, 0.45);
        });
      });
    },
    { scope: root }
  );

  return (
    <section id="projects" ref={root} className="relative isolate px-5 py-24 sm:px-8 lg:py-32">
      <Backdrop
        glows={[{ x: "85%", y: "35%", w: "900px", h: "800px", o: 0.076 }]}
        pattern="dots"
        patternMask="radial-gradient(ellipse 40% 40% at 10% 85%, #000, transparent 75%)"
      />
      <div className="mx-auto max-w-7xl">
        <SectionHeader heading={projects.heading} intro={projects.intro} />

        {/* Phones: a list (thumbnail | text) split by hairlines; wider screens: a grid of large images */}
        <ul
          ref={list}
          data-project-grid
          className="mt-10 grid border-t border-line sm:mt-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 sm:border-t-0"
        >
          {projects.items.map((p, i) => (
            <li key={p.slug} data-project hidden={!more.isShown(i)} className="flex items-center gap-5 border-b border-line py-5 sm:block sm:border-b-0 sm:py-0">
              <button
                type="button"
                {...spotlightHandlers}
                onClick={() => setOpen(p)}
                aria-label={`${projects.view}: ${p.title}`}
                className="group relative block aspect-[16/10] w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] sm:w-full"
              >
                <ProjectArt project={p} />
                <TileSpotlight />
                <span aria-hidden className="media-sheen pointer-events-none absolute inset-0" />
              </button>
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold leading-snug tracking-tight sm:mt-5 sm:text-2xl">{p.title}</h3>
                <p className="mt-1.5 text-sm text-fg-2 sm:mt-2 sm:text-base">{p.tagline}</p>
              </div>
            </li>
          ))}
        </ul>
        {more.hasMore && (
          <ShowMoreButton
            open={more.open}
            onClick={more.toggle}
            more={projects.more.replace("{n}", String(more.hidden))}
            less={projects.less}
          />
        )}
      </div>

      {open && (
        <Lightbox
          label={open.title}
          closeLabel={nav.close}
          onClose={() => setOpen(null)}
          className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-surface shadow-2xl"
        >
          {/* Scrolls inside the rounded frame, with a slim dark scrollbar */}
          <div className="scroll-thin max-h-[88svh] overflow-y-auto">
            <div className="relative aspect-[16/10] w-full">
              <ProjectArt project={open} large />
            </div>
            <div className="p-6 sm:p-10">
              <h3 className="text-silver font-display text-3xl font-semibold tracking-tight sm:text-5xl">{open.title}</h3>
              <p className="mt-3 text-lg text-fg">{open.tagline}</p>
              <p className="mt-4 leading-relaxed text-fg-2">{open.description}</p>
              {!!open.highlights.length && (
                <ul className="mt-5 space-y-2 text-sm text-fg-2">
                  {open.highlights.map((h) => (
                    <li key={h} className="flex gap-2.5">
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-fg-3" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
              {/* Logos sit in padded hit boxes: pull the row left so the first glyph lines up with the text */}
              <div className="-ml-1.5 mt-6">
                <TechLogos items={open.stack} size="sm" />
              </div>
            </div>
          </div>
        </Lightbox>
      )}
    </section>
  );
}

  /** The project's screenshot, or the graphite cover with its name. */
  function ProjectArt({ project, large = false }: { project: Project; large?: boolean }) {
    if (project.image) {
      return (
        <Image
          src={project.image}
          alt={large ? project.title : ""}
          fill
          sizes={large ? "(min-width: 1024px) 56rem, 100vw" : "(min-width: 640px) 50vw, 7rem"}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.04]"
        />
      );
    }
    // In the lightbox the name is already the heading below, so the cover stays plain.
    return <ProjectCover title={large ? "" : project.title} compact={!large} />;
  }

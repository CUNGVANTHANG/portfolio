"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { data } from "@/lib/data";
import { useSmoothScroll } from "../providers/SmoothScroll";

type Item = { id: string; label: string };

/** Id of the section crossing the middle of the viewport (null over the hero). */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((cur) => (cur === e.target.id ? null : cur));
        }
      },
      { rootMargin: "-45% 0px -55% 0px" }
    );
    key.split("|").forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [key]);
  return active;
}

function DownloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M8 2.5v8m0 0L4.75 7.25M8 10.5l3.25-3.25M3 13.5h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Uppercase, widely tracked labels — shared by every nav entry. */
const label = "font-display text-xs font-semibold uppercase tracking-[0.2em]";

/**
 * Section navigation, fixed at the top centre.
 * - Laptops and up: one pill with every section plus a Resume download; a
 *   silver highlight slides under the section in view.
 * - Phones/tablets: a compact pill showing the current section that opens a menu.
 *
 * Deliberately no backdrop-filter: blurring the live 3D robot behind it every
 * frame is what made the bar stutter. A near-opaque fill reads the same.
 */
export function SectionNav({ visible = true }: { visible?: boolean }) {
  const { nav, profile } = data;
  const items: Item[] = nav.items;
  const { scrollTo } = useSmoothScroll();
  const active = useActiveSection(items.map((i) => i.id));
  const [open, setOpen] = useState(false);

  const go = useCallback(
    (id: string) => {
      setOpen(false);
      scrollTo(id, { duration: 1.4 });
    },
    [scrollTo]
  );

  // Sliding highlight (desktop): moved with transform only, re-measured on resize / font load.
  const list = useRef<HTMLUListElement>(null);
  const [mark, setMark] = useState<{ x: number; w: number } | null>(null);
  const measure = useCallback(() => {
    const ul = list.current;
    const btn = active ? ul?.querySelector<HTMLElement>(`[data-id="${active}"]`) : null;
    if (!ul || !btn) return setMark(null);
    // Measure against the list itself: each <li> has a transform (entrance), so
    // offsetLeft would be relative to the <li> and always ~0.
    const u = ul.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setMark({ x: b.left - u.left, w: b.width });
  }, [active]);
  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const ul = list.current;
    if (!ul) return;
    const ro = new ResizeObserver(measure);
    ro.observe(ul);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  // Mobile menu: close on Escape or a tap outside.
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const current = items.find((i) => i.id === active);

  // Entrance: the bar slides down, then each entry rises in one after another.
  const enter = (i: number) => ({
    className: `transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none ${
      visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
    }`,
    style: { transitionDelay: visible ? `${380 + i * 70}ms` : "0ms" },
  });
  const surface = "border border-white/10 bg-[#141518]/95 shadow-[0_8px_30px_rgba(0,0,0,0.4)]";

  return (
    <nav
      aria-label="Sections"
      className={`fixed inset-x-0 top-4 z-50 flex justify-center px-4 transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none sm:top-5 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-[calc(100%+2rem)] opacity-0"
      }`}
    >
      {/* Laptops and up */}
      <div className={`hidden items-center gap-1 rounded-full p-1 lg:flex ${surface}`}>
        <ul ref={list} className="relative flex items-center [contain:layout_paint]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-full bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] will-change-transform"
            style={{ transform: `translate3d(${mark?.x ?? 0}px,0,0)`, width: mark?.w ?? 0, opacity: mark ? 1 : 0 }}
          />
          {items.map((it, i) => (
            <li key={it.id} {...enter(i)}>
              <button
                type="button"
                data-id={it.id}
                onClick={() => go(it.id)}
                aria-current={active === it.id ? "true" : undefined}
                className={`relative rounded-full px-5 py-2.5 transition-colors duration-300 ${label} ${
                  active === it.id ? "text-fg" : "text-fg-2 hover:text-fg"
                }`}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
        <span aria-hidden {...enter(items.length)} className={`mx-1 h-5 w-px bg-white/10 ${enter(items.length).className}`} />
        <span {...enter(items.length + 1)}>
          <a
            href={profile.resume}
            download
            className={`resume-btn group relative flex items-center gap-2 overflow-hidden rounded-full bg-fg px-5 py-2.5 text-bg transition-colors hover:bg-white ${label}`}
          >
            {/* Silver sheen that sweeps across on hover */}
            <span aria-hidden className="resume-sheen pointer-events-none absolute inset-0" />
            <span className="relative">{nav.resume}</span>
            <DownloadIcon className="resume-arrow relative size-3.5" />
        </a>
        </span>
      </div>

      {/* Phones and tablets */}
      <div ref={menu} className="relative lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="section-menu"
          className={`flex items-center gap-4 rounded-full py-2 pl-5 pr-2 text-fg ${surface} ${label}`}
        >
          <span className="min-w-24 text-left">{current?.label ?? nav.menu}</span>
          <span className="flex size-8 flex-col items-center justify-center gap-[3px] rounded-full bg-white/10" aria-hidden>
            <span className={`h-px w-3.5 bg-fg transition-transform duration-300 ${open ? "translate-y-[2px] rotate-45" : ""}`} />
            <span className={`h-px w-3.5 bg-fg transition-transform duration-300 ${open ? "-translate-y-[2px] -rotate-45" : ""}`} />
          </span>
          <span className="sr-only">{open ? nav.close : nav.menu}</span>
        </button>
        <div
          id="section-menu"
          className={`absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 rounded-2xl p-1.5 transition-[opacity,transform] duration-300 ${surface} ${
            open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => go(it.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors ${label} ${
                    active === it.id ? "bg-white/[0.08] text-fg" : "text-fg-2 hover:bg-white/[0.05] hover:text-fg"
                  }`}
                >
                  {it.label}
                  {active === it.id && <span className="size-1.5 rounded-full bg-fg" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          <a
            href={profile.resume}
            download
            tabIndex={open ? 0 : -1}
            className={`resume-btn group relative mt-1.5 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-fg px-4 py-3.5 text-bg ${label}`}
          >
            <span aria-hidden className="resume-sheen pointer-events-none absolute inset-0" />
            <span className="relative">{nav.resume}</span>
            <DownloadIcon className="resume-arrow relative size-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

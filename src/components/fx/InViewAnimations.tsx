"use client";

import { useEffect } from "react";

const SELECTOR = ".text-silver, [data-inview-anim]";

/**
 * Looping CSS animations (the silver shine on headings, the scroll hint…) are
 * paused by default in globals.css and only run while their element is on
 * screen: this marks visible ones with `data-inview`. Elements added later
 * (a lightbox, a route change) are picked up too.
 */
export function InViewAnimations() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) (e.target as HTMLElement).toggleAttribute("data-inview", e.isIntersecting);
      },
      { rootMargin: "0px" }
    );
    const seen = new WeakSet<Element>();
    const scan = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan(document);
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && (n.matches(SELECTOR) ? scan(n.parentElement ?? document) : scan(n)));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}

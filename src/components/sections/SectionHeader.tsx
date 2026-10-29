import type { ReactNode } from "react";
import { LineReveal } from "../fx/LineReveal";

/** Silver heading + optional intro, shared by every section. */
export function SectionHeader({ heading, intro, children }: { heading: string; intro?: string; children?: ReactNode }) {
  return (
    <header>
      <LineReveal
        as="h2"
        className="text-silver max-w-4xl font-display text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-tight"
      >
        {heading}
      </LineReveal>
      {intro && <p className="mt-5 max-w-xl text-base leading-relaxed text-fg-2 sm:text-lg">{intro}</p>}
      {children}
    </header>
  );
}

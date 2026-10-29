"use client";

import { useRef, type CSSProperties, type FC, type HTMLAttributes, type Ref } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useEntrance } from "@/lib/useEntrance";

type Tag = "h1" | "h2" | "h3" | "p" | "div" | "span";
type El = FC<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }>;

type Props = {
  children: string;
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  /** Undefined → on scroll into view; boolean → when true. */
  play?: boolean;
  delay?: number;
};

/** Text that rises in line by line, like subtitles fading onto the screen. */
export function LineReveal({ children, as = "p", className, style, play, delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as unknown as El;
  useEntrance(
    ref,
    (el) => {
      const split = SplitText.create(el, { type: "lines" });
      const anim = gsap.from(split.lines, {
        autoAlpha: 0,
        y: 28,
        filter: "blur(8px)",
        stagger: 0.12,
        duration: 1,
        delay,
        ease: "power3.out",
      });
      return { anim, revert: () => split.revert() };
    },
    { play, start: "top 85%" }
  );
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

"use client";

import { useRef, useState } from "react";

/**
 * Large email link: underline draws on hover, click copies it and shows a toast.
 * `onHover` / `onCopied` let a section react (e.g. the contact hands).
 */
export function CopyEmail({
  email,
  copiedLabel = "Email copied",
  onHover,
  onCopied,
  title,
  className = "underline-draw font-display text-[clamp(1.75rem,6vw,4.5rem)] font-semibold leading-tight tracking-tight",
  children,
}: {
  email: string;
  copiedLabel?: string;
  onHover?: (on: boolean) => void;
  onCopied?: () => void;
  title?: string;
  className?: string;
  /** Link content; defaults to the address itself. */
  children?: React.ReactNode;
}) {
  const [toast, setToast] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(email);
      e.preventDefault();
      setToast(true);
      onCopied?.();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(false), 1800);
    } catch {
      /* clipboard blocked: let the mailto: link open instead */
    }
  };

  return (
    <>
      <a
        href={`mailto:${email}`}
        onClick={copy}
        onPointerEnter={() => onHover?.(true)}
        onPointerLeave={() => onHover?.(false)}
        onFocus={() => onHover?.(true)}
        onBlur={() => onHover?.(false)}
        data-cursor="Copy"
        title={title}
        className={className}
      >
        {children ?? email}
      </a>
      <div
        role="status"
        className={`fixed bottom-6 left-1/2 z-[150] -translate-x-1/2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-bg shadow-lg transition-all duration-500 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        ✓ {copiedLabel}
      </div>
    </>
  );
}

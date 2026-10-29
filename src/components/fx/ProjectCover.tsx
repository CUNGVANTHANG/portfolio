/**
 * Monochrome cover art for projects without a screenshot: graphite grid + silver title.
 * `compact` is for grid thumbnails: a smaller title, hidden on the tiny phone thumbnails.
 */
export function ProjectCover({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#2a2c31,#121316_70%)]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />
      <span
        className={`text-silver absolute font-display font-semibold tracking-tight ${
          compact ? "bottom-5 left-6 hidden text-[clamp(1.75rem,3.2vw,2.75rem)] sm:block" : "bottom-6 left-7 text-[clamp(2.25rem,5vw,4.5rem)]"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

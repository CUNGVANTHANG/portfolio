import { data } from "@/lib/data";
import { StickyTimeline } from "../fx/StickyTimeline";
import { SectionHeader } from "./SectionHeader";
import { Backdrop } from "../fx/Backdrop";

/** Experience: big sticky year on the left, role details on the right. */
export function Experience() {
  const { experience } = data;
  return (
    <section id="experience" className="relative isolate px-5 py-24 sm:px-8 lg:py-32">
      <Backdrop
        glows={[
          { x: "38%", y: "50%", w: "520px", h: "130%", o: 0.076 },
          { x: "12%", y: "25%", w: "640px", h: "560px", o: 0.06 },
        ]}
      />
      <div className="mx-auto max-w-7xl">
        <SectionHeader heading={experience.heading} />
        <div className="mt-16">
          <StickyTimeline
            items={experience.items.map((j) => ({
              year: j.period.slice(0, 4),
              title: j.title,
              place: j.place,
              location: j.location,
              period: j.period,
              description: j.description,
              highlights: j.highlights,
              stack: j.stack,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

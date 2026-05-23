import { Timeline } from "@/components/timeline";
import { PageHero } from "@/components/page-hero";

export default function TimelinePage() {
  return (
    <section className="route route--timeline">
      <PageHero
        img="/assets/mt-sopris.jpg"
        alt="Mount Sopris panoramic"
        index="04 — Chronology"
        title={<>A working <em>chronology.</em></>}
        sub={
          <>
            Selected milestones from 1978 to the present — books, exhibitions,
            and the year of the photograph that occasioned each.
          </>
        }
      />

      <Timeline />
    </section>
  );
}

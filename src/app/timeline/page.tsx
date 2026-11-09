import type { Metadata } from "next";
import { Timeline } from "@/components/timeline";
import { PageHero } from "@/components/page-hero";

// Each page names itself as canonical (the root layout no longer points every page at "/").
export const metadata: Metadata = { alternates: { canonical: "/timeline" } };


export default function TimelinePage() {
  return (
    <section className="route route--timeline">
      <PageHero
        img="/assets/mt-sopris.jpg"
        alt="Mount Sopris panoramic"
        index="03 — Chronology"
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

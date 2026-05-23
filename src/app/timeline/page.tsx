import { Timeline } from "@/components/timeline";

export default function TimelinePage() {
  return (
    <section className="route route--timeline">
      <header className="page-head">
        <span className="page-head__index">04 — Chronology</span>
        <h1 className="page-head__title">A working chronology.</h1>
        <p className="page-head__sub">
          Selected milestones from 1978 to the present — books, awards,
          exhibitions, and the year of the photograph that occasioned each.
        </p>
      </header>

      <Timeline />
    </section>
  );
}

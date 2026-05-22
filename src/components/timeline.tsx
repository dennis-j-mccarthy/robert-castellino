"use client";

import { useEffect, useRef } from "react";

type Item = {
  year: string;
  title: React.ReactNode;
  body: React.ReactNode;
  chip: string;
  side: "l" | "r";
  variant?: "book" | "present";
};

const ITEMS: Item[] = [
  { side: "l", year: "1978", title: "Brooklyn → the West", body: <>Twenty years old. Drops a pre-med program at SUNY for a darkroom apprenticeship in Manhattan. Develops his first roll of Tri-X in a friend&apos;s bathroom and never quite returns to chemistry.</>, chip: "Age 20 · New York" },
  { side: "r", year: "1981", title: "Brooks Institute of Photography", body: <>Graduates the Santa Barbara program with a 4×5 view camera and a recommendation letter from Ernst Haas. Drives east to Colorado the following spring.</>, chip: "Age 23 · California" },
  { side: "l", year: "1982", title: "Assistant to John Fielder", body: <>Three seasons carrying tripods, loading film holders, and learning the Rockies from a man who knew them as well as anyone alive. Fielder later wrote the foreword to the new monograph.</>, chip: "Age 24 · Denver" },
  { side: "r", year: "1984", title: "First published photograph", body: <>An aspen grove on Independence Pass runs in the October issue of <em>Colorado Magazine</em>. Robert was paid sixty-five dollars and a copy of the magazine, both of which still hang in the studio.</>, chip: "Age 26 · Independence Pass" },
  { side: "l", year: "1989", title: "Boulder studio opens", body: <>The Pearl Street studio — still the working address — is signed for in March. A single 4×5 enlarger, two darkroom sinks, and the long oak desk built by Robert&apos;s father.</>, chip: "Age 31 · Boulder, CO" },
  { side: "r", year: "1993", title: "National Geographic commission", body: <>First commissioned spread for <em>NatGeo</em> — eight pages on the San Luis Valley in winter. Robert spent forty-two days in the field. They published six photographs and held seventy.</>, chip: "Age 35 · San Luis Valley" },
  { side: "l", year: "1998", variant: "book", title: <>The High Country — <em>first monograph</em></>, body: <>128 pages, 84 plates, published by Westcliffe. Two printings, now long out of print. Used copies appear on eBay roughly every four months and are gone within a day.</>, chip: "Age 40 · Book I" },
  { side: "r", year: "2002", title: <>Smithsonian — <em>The American West</em></>, body: <>Three plates included in the National Museum of American History group show. Robert flew to Washington for the opening and returned within the week.</>, chip: "Age 44 · Washington, D.C." },
  { side: "l", year: "2008", title: <>Lowell Thomas Award — Photo Essay</>, body: <>First of two Lowell Thomas Awards, for a long-form essay on the Pawnee National Grassland published in <em>Travel &amp; Leisure</em>.</>, chip: "Age 50 · SATW" },
  { side: "r", year: "2011", variant: "book", title: <>Plains — <em>second monograph</em></>, body: <>A 144-page meditation on the short-grass prairie. Includes the often-reproduced &ldquo;Pawnee, Storm Break&rdquo; plate. Aspen Art Museum solo show timed to release.</>, chip: "Age 53 · Book II" },
  { side: "l", year: "2014", title: "Ansel Adams Award", body: <>Sierra Club Ansel Adams Award for Conservation Photography — for the body of work documenting the Roan Plateau before and during industrial extraction.</>, chip: "Age 56 · Sierra Club" },
  { side: "r", year: "2017", title: "Hasselblad Masters, nominee", body: <>Landscape category, one of twelve nominees worldwide. The submission portfolio became the visual outline for the 2019 retrospective.</>, chip: "Age 59 · Sweden" },
  { side: "l", year: "2019", variant: "book", title: <>Colorado: Life &amp; Light on the Land</>, body: <>The career retrospective — 168 pages, 124 plates, foreword by John Fielder. First printing sold out in eleven weeks. Five printings to date.</>, chip: "Age 61 · Book III · magnum opus" },
  { side: "r", year: "2019", title: "Colorado Governor's Award for the Arts", body: <>Presented at the Capitol the same month the retrospective released. Robert wore the suit he was married in.</>, chip: "Age 61 · Denver" },
  { side: "l", year: "2022", title: "Lowell Thomas, second time", body: <>Travel Photographer of the Year — for a portfolio spanning Zion, the Maroon Bells, and the Pawnee in a single twelve-month season.</>, chip: "Age 64 · SATW" },
  { side: "r", year: "2023", title: <>Denver Art Museum — <em>The Long View</em></>, body: <>First solo museum retrospective — 86 prints, including six new large-format works never before exhibited. Ran from April through October.</>, chip: "Age 65 · DAM" },
  { side: "l", year: "2024", title: "Fifth printing", body: <><em>Colorado: Life &amp; Light on the Land</em> enters its fifth printing — an unusual run for a regional monograph and, by Robert&apos;s reckoning, a quiet vindication of the patience the work was made with.</>, chip: "Age 66 · Book III" },
  { side: "r", year: "Now", variant: "present", title: "Still at it", body: <>Working from the Pearl Street studio at sixty-eight. New work underway from the high passes of southern Colorado — the fourth book is &ldquo;a few winters off, but only a few.&rdquo;</>, chip: "Age 68 · Boulder, CO" },
];

export function Timeline() {
  const trackRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const orb = orbRef.current;
    const progress = progressRef.current;
    if (!track || !orb || !progress) return;

    const items = track.querySelectorAll(".timeline__item");

    function update() {
      if (!track || !orb || !progress) return;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = r.top - vh * 0.5;
      const total = r.height;
      const p = Math.max(0, Math.min(1, -start / total));
      const y = p * total;

      orb.style.transform = `translate(-50%, ${y}px)`;
      progress.style.height = y + "px";

      const orbY = r.top + y;
      items.forEach((it) => {
        const ir = it.getBoundingClientRect();
        const center = ir.top + ir.height * 0.5;
        const lit = center <= orbY + 20;
        it.classList.toggle("is-lit", lit);
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    const t1 = setTimeout(update, 80);
    const t2 = setTimeout(update, 300);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section className="timeline">
      <header className="section-head section-head--center">
        <div>
          <span className="section-head__eyebrow">— Forty Years on the Land</span>
          <h2 className="section-head__title">A working <em>chronology.</em></h2>
          <p className="section-head__sub">
            Selected milestones from 1978 to the present — books, awards, exhibitions, and the year of the photograph that occasioned each.
          </p>
        </div>
      </header>

      <div className="timeline__track" ref={trackRef}>
        <div className="timeline__spine" />
        <div className="timeline__progress" ref={progressRef} />
        <div className="timeline__orb" ref={orbRef}>
          <i />
          <i />
        </div>

        <ol className="timeline__list">
          {ITEMS.map((it, i) => (
            <li
              key={i}
              className={`timeline__item timeline__item--${it.side}${
                it.variant === "present" ? " timeline__item--present" : ""
              }`}
            >
              <div
                className={`timeline__card${
                  it.variant === "book"
                    ? " timeline__card--book"
                    : it.variant === "present"
                    ? " timeline__card--present"
                    : ""
                }`}
              >
                <span className="timeline__year">{it.year}</span>
                <h3 className="timeline__t">{it.title}</h3>
                <p className="timeline__p">{it.body}</p>
                <span className="timeline__chip">{it.chip}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

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
  { side: "l", year: "1984", title: "First published photograph", body: <>The first landscape photograph appears in print — the start of a working archive that has not stopped growing since.</>, chip: "Colorado" },
  { side: "r", year: "1989", title: "Boulder studio opens", body: <>The studio on Pearl Street opens its doors — and remains the working address to this day.</>, chip: "Boulder, CO" },
  { side: "l", year: "1998", variant: "book", title: <>The High Country — <em>first monograph</em></>, body: <>The first book of plates — a record of the high country as Robert had come to know it after fifteen years of looking.</>, chip: "Book I" },
  { side: "r", year: "2011", variant: "book", title: <>Plains — <em>second monograph</em></>, body: <>The second book — a meditation on the short-grass prairie east of the Front Range.</>, chip: "Book II" },
  { side: "l", year: "2019", variant: "book", title: <>Colorado: Life &amp; Light on the Land</>, body: <>The career retrospective — the working archive of half a century drawn into a single volume.</>, chip: "Book III · magnum opus" },
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

    const NAV_OFFSET = 110; // approximate fixed-nav height with buffer

    function update() {
      if (!track || !orb || !progress) return;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = r.top - vh * 0.5;
      const total = r.height;
      const p = Math.max(0, Math.min(1, -start / total));
      let y = p * total;

      // Clamp: the orb's viewport-y is (r.top + y). Never let it sit under
      // the fixed nav — pin to NAV_OFFSET when scrolled past.
      const orbViewportY = r.top + y;
      if (orbViewportY < NAV_OFFSET) {
        y = NAV_OFFSET - r.top;
      }
      // And never let it run past the end of the track.
      if (y > total) y = total;
      if (y < 0) y = 0;

      orb.style.transform = `translate(-50%, ${y}px)`;
      progress.style.height = y + "px";

      // Hide the orb when the track is entirely above or below the viewport
      const trackOffscreenAbove = r.bottom < NAV_OFFSET;
      const trackOffscreenBelow = r.top > vh;
      orb.style.opacity = trackOffscreenAbove || trackOffscreenBelow ? "0" : "1";

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

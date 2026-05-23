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
  {
    side: "l",
    year: "1985",
    title: "The first photograph",
    body: (
      <>
        It begins on a cold winter day in Oregon. At the time, Robert is VP of
        Operations and Marketing at Willamette Pass Ski Area. The camera comes
        out, and the work that follows never stops.
      </>
    ),
    chip: "Oregon",
  },
  {
    side: "r",
    year: "1991",
    title: <>A workshop with <em>Sam Abell</em></>,
    body: (
      <>
        Robert attends his first photographic workshop, with renowned National
        Geographic staff photographer Sam Abell — a turning point in the way he
        sees and composes.
      </>
    ),
    chip: "Workshop",
  },
  {
    side: "l",
    title: <>The Artist&apos;s Way</>,
    year: "Practice",
    body: (
      <>
        Robert becomes a student of Julia Cameron&apos;s <em>The Artist&apos;s
        Way</em> — a practice of attention and creative discipline that has
        shaped the photographic work since.
      </>
    ),
    chip: "Discipline",
  },
  {
    side: "r",
    variant: "book",
    year: "Book",
    title: <>Colorado: Life &amp; Light on the Land</>,
    body: (
      <>
        Self-published, in a Collectors Edition — a book of plates drawn from
        years of photographing the Rockies, the desert Southwest, and the
        quieter subjects in between.
      </>
    ),
    chip: "Collectors Edition",
  },
  {
    side: "l",
    variant: "present",
    year: "Now",
    title: "Lafayette, Colorado",
    body: (
      <>
        Working from Lafayette, CO. A Trusted Art Seller with The Art Storefronts
        Organization. One goal, unchanged since 1985 — to connect people with
        nature through fine art photography.
      </>
    ),
    chip: "Lafayette, CO",
  },
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

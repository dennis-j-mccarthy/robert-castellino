"use client";

import { useCallback, useEffect, useState } from "react";

// A quick look inside the book: a two-page spread per plate, turned with a
// page-flip animation. Plates are photographs that appear in the book.
const PLATES = [
  { src: "/gift-series/maroon-peaks.jpg", name: "Maroon Peaks over Maroon Lake" },
  { src: "/gift-series/hallett-dreamlake.jpg", name: "Hallett Peak over Dream Lake" },
  { src: "/gift-series/aspen-durango.jpg", name: "Golden aspen grove near Durango" },
  { src: "/gift-series/elk-moraine.jpg", name: "Elk in Moraine Park at dawn" },
  { src: "/gift-series/lake-isabelle.jpg", name: "Summer wildflowers at Lake Isabelle" },
  { src: "/gift-series/columbia-sunset.jpg", name: "Sunset over the Collegiate Range" },
  { src: "/gift-series/deerlodge-sunrise.jpg", name: "Cottonwoods at sunrise, Deerlodge Park" },
  { src: "/gift-series/lonepine-redmtn.jpg", name: "A lone pine in fresh snow, Red Mountain" },
  { src: "/gift-series/cranes-montevista.jpg", name: "Sandhill cranes, Monte Vista" },
  { src: "/gift-series/skier-brainard.jpg", name: "Backcountry skier near Brainard Lake" },
];

const TURN_MS = 650;

export function BookFlip() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState<null | "next" | "prev">(null);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (turning) return;
      const to = dir === "next" ? page + 1 : page - 1;
      if (to < 0 || to >= PLATES.length) return;
      setTurning(dir);
      window.setTimeout(() => {
        setPage(to);
        setTurning(null);
      }, TURN_MS);
    },
    [page, turning],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go]);

  const plate = PLATES[page];
  const nextPlate = PLATES[page + 1];
  const prevPlate = PLATES[page - 1];

  return (
    <>
      <button type="button" className="flip-open" onClick={() => { setPage(0); setOpen(true); }}>
        Flip through the book
        <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
          <path d="M2 7h10M7 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div className="flip" role="dialog" aria-modal="true" aria-label="Look inside the book" onClick={() => setOpen(false)}>
          <div className="flip__stage" onClick={(e) => e.stopPropagation()}>
            <div className="flip__spread">
              {/* Left page: the caption for the current plate (or the previous one while turning back). */}
              <div className="flip__page flip__page--left">
                <Caption plate={turning === "prev" && prevPlate ? prevPlate : plate} n={turning === "prev" ? page : page + 1} />
              </div>
              {/* Right page: the photograph (or the next one underneath while turning forward). */}
              <div className="flip__page flip__page--right">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={(turning === "next" && nextPlate ? nextPlate : plate).src} alt={(turning === "next" && nextPlate ? nextPlate : plate).name} />
              </div>

              {turning === "next" && nextPlate && (
                <div className="flip__leaf flip__leaf--next" style={{ animationDuration: `${TURN_MS}ms` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="flip__face flip__face--front"><img src={plate.src} alt="" /></div>
                  <div className="flip__face flip__face--back"><Caption plate={nextPlate} n={page + 2} /></div>
                </div>
              )}
              {turning === "prev" && prevPlate && (
                <div className="flip__leaf flip__leaf--prev" style={{ animationDuration: `${TURN_MS}ms` }}>
                  <div className="flip__face flip__face--front"><Caption plate={plate} n={page + 1} /></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="flip__face flip__face--back"><img src={prevPlate.src} alt="" /></div>
                </div>
              )}
            </div>

            <div className="flip__controls">
              <button type="button" onClick={() => go("prev")} disabled={page === 0 || !!turning} aria-label="Previous page">←</button>
              <span>{page + 1} / {PLATES.length}</span>
              <button type="button" onClick={() => go("next")} disabled={page === PLATES.length - 1 || !!turning} aria-label="Next page">→</button>
            </div>
            <button type="button" className="flip__close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
        </div>
      )}
    </>
  );
}

function Caption({ plate, n }: { plate: { name: string }; n: number }) {
  return (
    <div className="flip__caption">
      <span className="flip__plate">Plate {String(n).padStart(2, "0")}</span>
      <p>{plate.name}</p>
      <span className="flip__credit">Colorado: Life &amp; Light on the Land</span>
    </div>
  );
}

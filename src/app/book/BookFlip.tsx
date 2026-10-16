"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A look inside the real book: 15 two-page spreads rendered from the print PDF
// (resources/colorado-life-and-light-book.pdf, kept local) into
// public/book-preview. A preview only — about a quarter of the book.
const SPREADS: [number, number][] = [
  [7, 8], [9, 10], [11, 12], [23, 24], [29, 30], [37, 38], [43, 44], [53, 54],
  [63, 64], [73, 74], [79, 80], [87, 88], [97, 98], [111, 112], [113, 114],
];
const src = (n: number) => `/book-preview/p${String(n).padStart(3, "0")}.jpg`;

const TURN_MS = 700;

export function BookFlip() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [turning, setTurning] = useState<null | "next" | "prev">(null);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (turning) return;
      const to = dir === "next" ? i + 1 : i - 1;
      if (to < 0 || to >= SPREADS.length) return;
      setTurning(dir);
      window.setTimeout(() => {
        setI(to);
        setTurning(null);
      }, TURN_MS);
    },
    [i, turning],
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

  // Warm the cache for the neighbouring spreads so a turn never shows a blank page.
  useEffect(() => {
    if (!open) return;
    for (const s of [SPREADS[i + 1], SPREADS[i - 1]]) {
      if (s) s.forEach((n) => { new Image().src = src(n); });
    }
  }, [open, i]);

  const [l, r] = SPREADS[i];
  const next = SPREADS[i + 1];
  const prev = SPREADS[i - 1];
  // What sits underneath the turning leaf.
  const leftUnder = turning === "prev" && prev ? prev[0] : l;
  const rightUnder = turning === "next" && next ? next[1] : r;

  function close() {
    setOpen(false);
  }

  function order() {
    setOpen(false);
    document.querySelector<HTMLButtonElement>(".offer-card__cta")?.focus();
    document.querySelector(".offer-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <button type="button" className="flip-open" onClick={() => { setI(0); setOpen(true); }}>
        <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <circle cx="6.8" cy="6.8" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10.2 10.2L14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Look inside the book
      </button>

      {open && createPortal(
        <div className="flip" role="dialog" aria-modal="true" aria-label="Look inside the book" onClick={close}>
          <div className="flip__stage" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable @next/next/no-img-element */}
            <div className="flip__spread">
              <div className="flip__page flip__page--left"><img src={src(leftUnder)} alt={`Page ${leftUnder}`} /></div>
              <div className="flip__page flip__page--right"><img src={src(rightUnder)} alt={`Page ${rightUnder}`} /></div>

              {turning === "next" && next && (
                <div className="flip__leaf flip__leaf--next" style={{ animationDuration: `${TURN_MS}ms` }}>
                  <div className="flip__face flip__face--front"><img src={src(r)} alt="" /></div>
                  <div className="flip__face flip__face--back"><img src={src(next[0])} alt="" /></div>
                </div>
              )}
              {turning === "prev" && prev && (
                <div className="flip__leaf flip__leaf--prev" style={{ animationDuration: `${TURN_MS}ms` }}>
                  <div className="flip__face flip__face--front"><img src={src(l)} alt="" /></div>
                  <div className="flip__face flip__face--back"><img src={src(prev[1])} alt="" /></div>
                </div>
              )}
            </div>
            {/* eslint-enable @next/next/no-img-element */}

            <div className="flip__controls">
              <button type="button" onClick={() => go("prev")} disabled={i === 0 || !!turning} aria-label="Previous spread">←</button>
              <span>Pages {l}–{r} · {i + 1} of {SPREADS.length}</span>
              <button type="button" onClick={() => go("next")} disabled={i === SPREADS.length - 1 || !!turning} aria-label="Next spread">→</button>
            </div>
            <div className="flip__foot">
              <span>A 30-page preview of the book.</span>
              <button type="button" className="flip__order" onClick={order}>Order a signed copy</button>
            </div>
            <button type="button" className="flip__close" onClick={close} aria-label="Close">×</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

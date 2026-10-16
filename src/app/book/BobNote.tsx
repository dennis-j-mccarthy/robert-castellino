"use client";

import { useEffect, useState } from "react";

export function BobNote() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="bobnote__trigger" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 7v6l3.5 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        A statement from Robert — why I wake early
      </button>

      {open && (
        <div
          className="bobnote"
          role="dialog"
          aria-modal="true"
          aria-label="A statement from Robert Castellino"
          onClick={() => setOpen(false)}
        >
          <div className="bobnote__card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bobnote__close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
            <span className="bobnote__eyebrow">— In his words</span>
            <h3 className="bobnote__title">Why I wake early.</h3>
            <div className="bobnote__body">
              <p>
                I have never been able to explain it to anyone who hasn&apos;t stood in it. The
                hour before the sun is the most honest hour Colorado has. The valleys are still
                holding the night&apos;s cold, the light hasn&apos;t decided what kind of day it
                will be, and for a few minutes the whole state seems to be waiting for
                something — the same thing I am waiting for.
              </p>
              <p>
                Fifty years in, I still set the alarm for the dark. I drive up a pass with the
                heater running and the coffee going cold, and I stand in the wet grass before
                anyone else is awake, because that is when the light arrives like it means it. It
                comes over a ridge the way grace does — unearned, unhurried, and gone before you
                can close your hand around it.
              </p>
              <p>
                People think landscape photography is about places. It isn&apos;t. It is about
                mornings — about being there, ready and quiet enough to receive the light when it
                finally speaks, and humble enough to know your only real job is to stay out of
                its way. Every plate in this book is a morning I was given. I simply happened to
                be standing there, awake and grateful, with a camera.
              </p>
              <p>
                That is why I wake early. Not to take the photograph. To be there when it is
                offered.
              </p>
              <p className="bobnote__sign">Robert Castellino</p>
              <p className="bobnote__place">Boulder, Colorado · before dawn</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { MUSINGS, CAT_META, type MusingCategory } from "@/data/musings";

const FILTERS: { key: "all" | MusingCategory; label: string }[] = [
  { key: "all",         label: "All Entries" },
  { key: "reflections", label: "Reflections" },
  { key: "light",       label: "Light" },
  { key: "land",        label: "Land" },
  { key: "locations",   label: "Locations" },
  { key: "wilderness",  label: "Wilderness" },
];

export default function MusingsPage() {
  const [filter, setFilter] = useState<"all" | MusingCategory>("all");

  return (
    <section className="route route--musings">
      <header className="page-head">
        <span className="page-head__index">06 — Musings</span>
        <h1 className="page-head__title">Musings</h1>
        <p className="page-head__sub">
          Short essays from the studio — reflections, life lessons, and quiet
          notes on light, land, locations, and the wilderness. Updated when the work
          allows it.
        </p>

        <div className="filters filters--mus" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter ${filter === f.key ? "is-active" : ""}`}
              onClick={() => setFilter(f.key)}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="musings-grid">
        {MUSINGS.map((m) => {
          const c = CAT_META[m.cat];
          const hasImg = !!m.img;
          const size = m.size || (hasImg ? "md" : "sm");
          const show = filter === "all" || m.cat === filter;

          return (
            <Link
              key={m.id}
              href={`/musings/${m.id}`}
              className={`mus mus--${size} ${hasImg ? "mus--img" : "mus--text"} ${show ? "" : "is-hidden"}`}
              data-cat={m.cat}
            >
              {hasImg && (
                <div className="mus__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.img} alt={m.title} loading="lazy" />
                </div>
              )}
              <div className="mus__body">
                <div className="mus__head">
                  <span
                    className="mus__cat"
                    style={{ ["--c" as string]: c.color }}
                  >
                    <i className="mus__cat-dot" />
                    {c.label}
                  </span>
                  <span className="mus__num">{m.num}</span>
                </div>
                <h3 className="mus__title">{m.title}</h3>
                <p className="mus__excerpt">{m.excerpt}</p>
                <div className="mus__foot">
                  <span className="mus__date">{m.date}</span>
                  <span className="mus__read">
                    Read on
                    <svg viewBox="0 0 14 14" width="11" height="11">
                      <path
                        d="M2 7h10M7 2l5 5-5 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <aside className="gallery-cta">
        <div>
          <span className="kicker kicker--gold">— Subscribe to the journal</span>
          <h3 className="display">New essays, four times a year.</h3>
          <p>
            A quiet quarterly letter from the Boulder studio — new field notes,
            occasional plates, and dates for the next workshop on the passes.
          </p>
        </div>
        <a className="btn btn--gold" href="#">Get the letter</a>
      </aside>
    </section>
  );
}

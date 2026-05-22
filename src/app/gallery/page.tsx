"use client";

import Link from "next/link";
import { useState } from "react";

type Plate = {
  no: string;
  title: string;
  loc: string;
  img: string;
  cats: string[];
  size: "xl" | "sq" | "tall" | "wide";
};

const PLATES: Plate[] = [
  { no: "01", title: "Mount Yale, Last Light",      loc: "Cottonwood Pass, CO · 2023", img: "/assets/mt-yale.jpg",       cats: ["mountain", "light"], size: "xl" },
  { no: "02", title: "Lone Pine, Quiet Drift",      loc: "Red Mountain Pass, CO · 2022", img: "/assets/lone-pine.jpg",   cats: ["snow"],              size: "sq" },
  { no: "03", title: "Maroon Bells, Summer's End",  loc: "Aspen Snowmass, CO · 2022", img: "/assets/maroon-bells.jpg",   cats: ["mountain"],          size: "tall" },
  { no: "04", title: "Mt. Sopris Panoramic",        loc: "Carbondale, CO · 2021", img: "/assets/mt-sopris.jpg",          cats: ["mountain"],          size: "wide" },
  { no: "05", title: "Pawnee Buttes, Storm Break",  loc: "Pawnee Grassland, CO · 2023", img: "/assets/pawnee-buttes.jpg", cats: ["plains", "light"],   size: "sq" },
  { no: "06", title: "Walk Through Weather",        loc: "Northern Range, CO · 2020", img: "/assets/horses-snow.jpg",     cats: ["snow"],              size: "sq" },
  { no: "07", title: "A Quick Rain on the Sunflowers", loc: "Front Range, CO · 2019", img: "/assets/sunflowers.png",      cats: ["light"],             size: "wide" },
];

const FILTERS = [
  { key: "all",      label: "All Frames" },
  { key: "mountain", label: "Mountains" },
  { key: "snow",     label: "Snow & Stillness" },
  { key: "plains",   label: "Plains & Prairie" },
  { key: "light",    label: "Light Studies" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState("all");

  return (
    <section className="route route--work">
      <header className="page-head">
        <span className="page-head__index">02 — Gallery</span>
        <h1 className="page-head__title">The Archive</h1>
        <p className="page-head__sub">
          Forty years of looking at the Colorado high country, the plains, and the
          wider American West — a working archive of the photographs Robert
          considers his best.
        </p>

        <div className="filters" role="tablist">
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

      <div className="gallery">
        {PLATES.map((p) => {
          const show = filter === "all" || p.cats.includes(filter);
          return (
            <figure
              key={p.no}
              className={`g g--${p.size} ${show ? "" : "is-hidden"}`}
              data-cat={p.cats.join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt={p.title} />
              <figcaption>
                <span className="g__no">{p.no}</span>
                <span className="g__title">{p.title}</span>
                <span className="g__loc">{p.loc}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <aside className="gallery-cta">
        <div>
          <span className="kicker kicker--gold">— Fine art prints</span>
          <h3 className="display">Bring a piece of the West home.</h3>
          <p>
            Limited-edition prints on archival paper, canvas, metal, and acrylic.
            Signed and editioned, shipped from the Boulder studio.
          </p>
        </div>
        <Link className="btn btn--gold" href="/book">See print options</Link>
      </aside>
    </section>
  );
}

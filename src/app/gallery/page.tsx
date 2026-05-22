"use client";

import Link from "next/link";
import { useState } from "react";
import { PrintModal } from "@/components/print-modal";

type Plate = {
  no: string;
  title: string;
  loc: string;
  img: string;
  cats: string[];
  size: "xl" | "sq" | "tall" | "wide";
  blurb: string;
};

const PLATES: Plate[] = [
  {
    no: "01", title: "Mount Yale, Last Light",
    loc: "Cottonwood Pass, CO · 2023",
    img: "/assets/mt-yale.jpg",
    cats: ["mountain", "light"], size: "xl",
    blurb: "A service spur east of the summit. Storms cleared at 18:42; the peak was lit for thirty-eight seconds. I had been visiting the spot for nine autumns.",
  },
  {
    no: "02", title: "Lone Pine, Quiet Drift",
    loc: "Red Mountain Pass, CO · 2022",
    img: "/assets/lone-pine.jpg",
    cats: ["snow"], size: "sq",
    blurb: "The mountain made a bowl of snow and a single tree decided to stand in it. Six winters of visiting the same tree before this one frame asked to be made.",
  },
  {
    no: "03", title: "Maroon Bells, Summer's End",
    loc: "Aspen Snowmass, CO · 2022",
    img: "/assets/maroon-bells.jpg",
    cats: ["mountain"], size: "tall",
    blurb: "A slow lake, an early frost, and the bells lit for forty seconds. The famous overlook turned around — this is the other shore.",
  },
  {
    no: "04", title: "Mt. Sopris Panoramic",
    loc: "Carbondale, CO · 2021",
    img: "/assets/mt-sopris.jpg",
    cats: ["mountain"], size: "wide",
    blurb: "Three thousand exposures of this mountain over forty years; this is one of the three I would defend. Made under conditions I could not have predicted and would not have requested.",
  },
  {
    no: "05", title: "Pawnee Buttes, Storm Break",
    loc: "Pawnee Grassland, CO · 2023",
    img: "/assets/pawnee-buttes.jpg",
    cats: ["plains", "light"], size: "sq",
    blurb: "The only vertical thing for a long way in any direction. Stop trying to photograph the buttes themselves; start photographing the grass at their feet.",
  },
  {
    no: "06", title: "Walk Through Weather",
    loc: "Northern Range, CO · 2020",
    img: "/assets/horses-snow.jpg",
    cats: ["snow"], size: "sq",
    blurb: "Three hundred yards downwind in a snowstorm that obscured both me and them. Eight dark shapes moving through pale grass — one of the photographs I am still surprised by.",
  },
  {
    no: "07", title: "A Quick Rain on the Sunflowers",
    loc: "Front Range, CO · 2019",
    img: "/assets/sunflowers.png",
    cats: ["light"], size: "wide",
    blurb: "Late August on a service road most maps do not show. The rain lasted four minutes; the light, perhaps two. Both were enough.",
  },
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
  const [openPlate, setOpenPlate] = useState<Plate | null>(null);

  return (
    <section className="route route--work">
      <header className="page-head">
        <span className="page-head__index">02 — Gallery</span>
        <h1 className="page-head__title">The Archive</h1>
        <p className="page-head__sub">
          A gallery of the best nature photography of the American West —
          spanning half a century behind the lens.
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
              <button
                type="button"
                className="g__media"
                onClick={() => setOpenPlate(p)}
                aria-label={`View print options for ${p.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.title} />
                <span className="g__hint">
                  <span>View print</span>
                  <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true">
                    <path
                      d="M2 7h10M7 2l5 5-5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                </span>
              </button>
              <div className="g__caption">
                <div className="g__caption-head">
                  <span className="g__no">{p.no}</span>
                  <span className="g__loc">{p.loc}</span>
                </div>
                <h3 className="g__title">{p.title}</h3>
                <p className="g__blurb">{p.blurb}</p>
              </div>
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

      <PrintModal
        open={openPlate !== null}
        onClose={() => setOpenPlate(null)}
        image={openPlate}
      />
    </section>
  );
}

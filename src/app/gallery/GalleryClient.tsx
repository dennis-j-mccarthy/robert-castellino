"use client";

import { useState } from "react";
import { PrintModal } from "@/components/print-modal";
import { PageHero } from "@/components/page-hero";

export type CollectionData = {
  slug: string;
  label: string;
  intro: string;
  photos: { img: string; title: string; loc: string; blurb: string }[];
};

type Plate = {
  no: string;
  title: string;
  loc: string;
  img: string;
  blurb: string;
};

const ARCHIVE: Plate[] = [
  {
    no: "01", title: "Mount Yale, Last Light",
    loc: "Cottonwood Pass, CO · 2023",
    img: "/assets/mt-yale.jpg",
    blurb: "A service spur east of the summit. Storms cleared at 18:42; the peak was lit for thirty-eight seconds. I had been visiting the spot for nine autumns.",
  },
  {
    no: "02", title: "Lone Pine, Quiet Drift",
    loc: "Red Mountain Pass, CO · 2022",
    img: "/assets/lone-pine.jpg",
    blurb: "The mountain made a bowl of snow and a single tree decided to stand in it. Six winters of visiting the same tree before this one frame asked to be made.",
  },
  {
    no: "03", title: "Maroon Bells, Summer's End",
    loc: "Aspen Snowmass, CO · 2022",
    img: "/assets/maroon-bells.jpg",
    blurb: "A slow lake, an early frost, and the bells lit for fifty seconds. The famous overlook turned around — this is the other shore.",
  },
  {
    no: "04", title: "Mt. Sopris Panoramic",
    loc: "Carbondale, CO · 2021",
    img: "/assets/mt-sopris.jpg",
    blurb: "Three thousand exposures of this mountain over fifty years; this is one of the three I would defend. Made under conditions I could not have predicted and would not have requested.",
  },
  {
    no: "05", title: "Pawnee Buttes, Storm Break",
    loc: "Pawnee Grassland, CO · 2023",
    img: "/assets/pawnee-buttes.jpg",
    blurb: "The only vertical thing for a long way in any direction. Stop trying to photograph the buttes themselves; start photographing the grass at their feet.",
  },
  {
    no: "06", title: "Walk Through Weather",
    loc: "Northern Range, CO · 2020",
    img: "/assets/horses-snow.jpg",
    blurb: "Three hundred yards downwind in a snowstorm that obscured both me and them. Eight dark shapes moving through pale grass — one of the photographs I am still surprised by.",
  },
  {
    no: "07", title: "A Quick Rain on the Sunflowers",
    loc: "Front Range, CO · 2019",
    img: "/assets/sunflowers.png",
    blurb: "Late August on a service road most maps do not show. The rain lasted four minutes; the light, perhaps two. Both were enough.",
  },
];

function makeNo(prefix: string, idx: number) {
  return `${prefix}.${String(idx + 1).padStart(3, "0")}`;
}

export default function GalleryClient({ collections }: { collections: CollectionData[] }) {
  const [filter, setFilter] = useState("all");
  const [openPlate, setOpenPlate] = useState<Plate | null>(null);

  const showArchive = filter === "all" || filter === "archive";

  const COLLECTION_FILTERS = [
    { key: "all",     label: "All Collections" },
    { key: "archive", label: "Selected Plates" },
    ...collections.map((c) => ({ key: c.slug, label: c.label })),
  ];

  return (
    <section className="route route--work">
      <PageHero
        img="/assets/mt-yale.jpg"
        alt="Mount Yale at last light"
        index="— Catching light for fifty years"
        title={<>The <em>Gallery.</em></>}
        sub={
          <>
            A gallery of nature photography — mountains, streams, light, land,
            sky — spanning half a century behind the lens.
          </>
        }
      />
      <header className="page-head page-head--compact">
        <div className="filters" role="tablist">
          {COLLECTION_FILTERS.map((f) => (
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

      {showArchive && (
        <section className="collection">
          <header className="collection__head">
            <span className="collection__eyebrow">— Selected plates</span>
            <h2 className="collection__title">Selected Plates</h2>
            <p className="collection__intro">
              The seven plates Robert returns to most often — the spine of the working gallery.
            </p>
          </header>
          <div className="gallery">
            {ARCHIVE.map((p) => (
              <PlateFigure key={p.no} plate={p} onOpen={setOpenPlate} />
            ))}
          </div>
        </section>
      )}

      {collections.map((collection) => {
        if (filter !== "all" && filter !== collection.slug) return null;
        const prefix = collection.slug
          .split("-")
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("");
        return (
          <section key={collection.slug} className="collection">
            <header className="collection__head">
              <span className="collection__eyebrow">— Collection</span>
              <h2 className="collection__title">{collection.label}</h2>
              <p className="collection__intro">{collection.intro}</p>
            </header>
            <div className="gallery">
              {collection.photos.map((photo, i) => {
                const plate: Plate = {
                  no: makeNo(prefix, i),
                  title: photo.title,
                  loc: photo.loc,
                  img: photo.img,
                  blurb: photo.blurb,
                };
                return (
                  <PlateFigure key={photo.img} plate={plate} onOpen={setOpenPlate} />
                );
              })}
            </div>
          </section>
        );
      })}

      <PrintModal
        open={openPlate !== null}
        onClose={() => setOpenPlate(null)}
        image={openPlate}
      />

      <div className="gallery-bar" role="note">
        <span className="gallery-bar__dot" aria-hidden="true" />
        <span className="gallery-bar__text">
          All images available for printing — from <strong>10×8</strong> to
          dramatic poster size. <em>Click an image for details.</em>
        </span>
      </div>
    </section>
  );
}

function PlateFigure({ plate, onOpen }: { plate: Plate; onOpen: (p: Plate) => void }) {
  return (
    <figure className="g">
      <button
        type="button"
        className="g__media"
        onClick={() => onOpen(plate)}
        aria-label={`View print options for ${plate.title}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={plate.img} alt={plate.title} loading="lazy" />
        <span className="g__hint">
          <span>View print</span>
          <svg viewBox="0 0 14 14" width="11" height="11" aria-hidden="true">
            <path d="M2 7h10M7 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </span>
      </button>
      <div className="g__caption">
        <div className="g__caption-head">
          <span className="g__no">{plate.no}</span>
          <span className="g__loc">{plate.loc}</span>
        </div>
        <h3 className="g__title">{plate.title}</h3>
        <p className="g__blurb">{plate.blurb}</p>
      </div>
    </figure>
  );
}

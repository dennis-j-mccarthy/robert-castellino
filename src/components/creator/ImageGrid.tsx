"use client";

import { useMemo, useState } from "react";
import type { LibraryItem } from "@/lib/creator/library";
import type { Pillar } from "@/lib/creator/pillars";

/*
  The image grid every picker shares (Library, Post maker, Blog hero).
  Filters: collection, pillar, "in the book" only. Mockups (the AI book
  renders) carry a red badge and are hidden by default — pass
  `allowMockups` to show them at all (the Library does; pickers never do).
*/

export const IN_BOOK = "__book__";

interface Props {
  items: LibraryItem[];
  pillars: Pillar[];
  selected?: string | null;
  onSelect: (item: LibraryItem) => void;
  /** Show mockups (badged). Default false: they are filtered out entirely. */
  allowMockups?: boolean;
  /** Initial collection filter ("" = all, IN_BOOK = plates in the book). */
  initialCollection?: string;
  initialPillar?: string;
  maxHeight?: number;
  compact?: boolean;
}

export function Badges({ item, compact }: { item: LibraryItem; compact?: boolean }) {
  return (
    <>
      {item.inBook && (
        <span className="cr-badge cr-badge--book" title="This plate is in the book">
          {item.bookPage ? `p.${item.bookPage}` : "book"}
        </span>
      )}
      {item.mockup && (
        <span className="cr-badge cr-badge--mockup" title="AI mockup — never use in ads or posts">
          {compact ? "Mockup" : "Mockup — never use in ads/posts"}
        </span>
      )}
    </>
  );
}

export default function ImageGrid(props: Props) {
  const { items, pillars, selected, onSelect, allowMockups = false, maxHeight = 420, compact } = props;
  const [collection, setCollection] = useState<string>(props.initialCollection ?? "");
  const [pillar, setPillar] = useState<string>(props.initialPillar ?? "");
  const [query, setQuery] = useState("");

  const base = useMemo(() => (allowMockups ? items : items.filter((i) => !i.mockup)), [items, allowMockups]);
  const collections = useMemo(() => Array.from(new Set(base.map((i) => i.collection))).sort(), [base]);
  const bookCount = useMemo(() => base.filter((i) => i.inBook).length, [base]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter((i) => {
      if (collection === IN_BOOK && !i.inBook) return false;
      if (collection && collection !== IN_BOOK && i.collection !== collection) return false;
      if (pillar && i.pillarId !== pillar) return false;
      if (q && !`${i.label} ${i.title ?? ""} ${i.loc ?? ""} ${i.collection}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [base, collection, pillar, query]);

  return (
    <div className="cr-imagegrid">
      <div className="ads-row">
        <select className="ads-input ads-input--sm" value={collection} onChange={(e) => setCollection(e.target.value)}>
          {bookCount > 0 && <option value={IN_BOOK}>In the book ({bookCount})</option>}
          <option value="">All collections ({base.length})</option>
          {collections.map((c) => (
            <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
          ))}
        </select>
        <select className="ads-input ads-input--sm" value={pillar} onChange={(e) => setPillar(e.target.value)}>
          <option value="">Any pillar</option>
          {pillars.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input className="ads-input ads-input--sm cr-search" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className={`ads-grid${compact ? " ads-grid--compact" : ""}`} style={{ maxHeight }}>
        {shown.map((img) => (
          <button
            key={img.src}
            type="button"
            className={`ads-thumb${selected === img.src ? " is-selected" : ""}${img.mockup ? " is-mockup" : ""}`}
            title={[img.title ?? img.label, img.loc, img.bookPage ? `book p.${img.bookPage}` : null].filter(Boolean).join(" · ")}
            onClick={() => onSelect(img)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static library thumbs */}
            <img src={img.src} alt={img.title ?? img.label} loading="lazy" />
            <span className="cr-thumb__badges">
              <Badges item={img} compact />
            </span>
          </button>
        ))}
        {!shown.length && <div className="ads-hint">Nothing matches.</div>}
      </div>
    </div>
  );
}

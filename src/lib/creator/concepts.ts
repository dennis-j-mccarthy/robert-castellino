import concepts from "@/data/book-concepts.json";

/*
  The 37 book-ad concepts (Oct 26), grouped F / G / H. Client-safe (10 KB).
  "Stage in Ads maker" deep-links to the existing /admin/ads with the query
  params its prefill accepts (h, m, d, name, img) — see AdsClient.tsx. The
  Ads maker then enforces: paused creation only, in-book plates for book ads.
*/

export interface Concept {
  n: number;
  /** Headline */
  t: string;
  /** Primary text */
  pt: string;
  /** Description (under the headline) */
  d: string;
}

export interface ConceptSet {
  set: string;
  goal: string;
  ads: Concept[];
}

export const CONCEPT_SETS: ConceptSet[] = concepts as ConceptSet[];

export const CONCEPT_COUNT = CONCEPT_SETS.reduce((n, s) => n + s.ads.length, 0);

/** Where "Stage in Ads maker" sends a concept. `img` is optional — the maker defaults to in-book plates. */
export function adsMakerPrefillUrl(c: Concept, set: string, img?: string): string {
  const q = new URLSearchParams({
    h: c.t,
    m: c.pt,
    d: c.d,
    name: `Book · Concept ${set}${c.n} · ${c.t}`,
  });
  if (img) q.set("img", img);
  return `/admin/ads?${q.toString()}`;
}

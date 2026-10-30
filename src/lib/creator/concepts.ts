import concepts from "@/data/book-concepts.json";

/*
  The 37 book-ad concepts (Oct 26), grouped F / G / H, each with the plate the
  review page (bob-book-ad-concepts.html) assigned to it. Client-safe.

  A concept becomes a real ad in the book campaign through
  POST /api/creator/ads/stage (created PAUSED). The ad's Meta name is
  deterministic — `conceptAdName()` — so the page can match live ads back to
  their concept and show "in Meta / not in Meta" on every card.
*/

export interface ConceptPlate {
  /** Site path of the plate image (in the book, never a mockup). */
  src: string;
  label: string;
  page: number;
}

export interface Concept {
  n: number;
  /** Headline */
  t: string;
  /** Primary text */
  pt: string;
  /** Description (under the headline) */
  d: string;
  plate: ConceptPlate;
}

export interface ConceptSet {
  set: string;
  title: string;
  goal: string;
  ads: Concept[];
}

export const CONCEPT_SETS: ConceptSet[] = concepts as ConceptSet[];

export const CONCEPT_COUNT = CONCEPT_SETS.reduce((n, s) => n + s.ads.length, 0);

const PREFIX = "Book · Concept ";

/** The exact ad name used in Meta for a concept, e.g. "Book · Concept 07 · Some Moments Come Only Once". */
export function conceptAdName(c: Concept): string {
  return `${PREFIX}${String(c.n).padStart(2, "0")} · ${c.t}`;
}

/** Reverse of conceptAdName: the concept number inside a Meta ad name, or null. */
export function conceptNumberFromAdName(name: string): number | null {
  const m = name.match(/^Book · Concept (\d+)\b/);
  return m ? Number(m[1]) : null;
}

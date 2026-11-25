import { studio } from "@/studio.config";
/*
  Strategy → Keywords: the phrases people type when they are looking for
  something Bob makes. Client-safe (no Prisma).

  `priority` (0–100) is OUR judgement of how valuable a phrase is, not a
  search volume. Gift phrases rank highest: the person searching wants to
  buy something and has not picked it yet. The word cloud is sized by this
  score and says so.

  Photography and the book only. Fluid Pathways (craniosacral) keywords
  live in the Fluid Pathways studio and never here.

  SEED_KEYWORDS is inserted by migration 0010 (ON CONFLICT DO NOTHING).
*/

export type KeywordKind = string;
export type KeywordStatus = "idea" | "target" | "dropped";

export interface KeywordRow {
  id: string;
  phrase: string;
  kind: KeywordKind;
  priority: number;
  status: KeywordStatus;
  source: string;
  note: string | null;
}

export const KEYWORD_KINDS: KeywordKind[] = studio.keywordKinds.map((k) => k.id);

export const KIND_LABEL: Record<KeywordKind, string> = Object.fromEntries(studio.keywordKinds.map((k) => [k.id, k.label]));

export function keywordId(phrase: string): string {
  return phrase
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type Seed = { phrase: string; kind: KeywordKind; priority: number; status?: KeywordStatus; note?: string };

export const SEED_KEYWORDS: Seed[] = studio.seedKeywords as Seed[];

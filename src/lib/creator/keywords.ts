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

export type KeywordKind = "gift" | "book" | "photography" | "question";
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

export const KEYWORD_KINDS: KeywordKind[] = ["gift", "book", "photography", "question"];

export const KIND_LABEL: Record<KeywordKind, string> = {
  gift: "Gift searches",
  book: "Coffee table book",
  photography: "Photography and the photographer",
  question: "Question",
};

export function keywordId(phrase: string): string {
  return phrase
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type Seed = { phrase: string; kind: KeywordKind; priority: number; status?: KeywordStatus; note?: string };

export const SEED_KEYWORDS: Seed[] = [
  // Gift searches: the buyer has money in hand and no pick yet
  { phrase: "Colorado gifts", kind: "gift", priority: 88, status: "target", note: "Holiday timing: mid-Nov to Dec 15" },
  { phrase: "Colorado Christmas gifts", kind: "gift", priority: 84, status: "target", note: "Holiday timing" },
  { phrase: "gifts for someone who loves Colorado", kind: "gift", priority: 80 },
  { phrase: "mountain gifts", kind: "gift", priority: 72, note: "Holiday timing" },
  { phrase: "gifts for hikers", kind: "gift", priority: 64, note: "Holiday timing" },
  { phrase: "signed photography book gift", kind: "gift", priority: 70 },
  { phrase: "housewarming gift Colorado", kind: "gift", priority: 60 },
  { phrase: "gift for someone moving away from Colorado", kind: "gift", priority: 58 },
  // The book: Colorado: Life & Light on the Land
  { phrase: "Colorado coffee table book", kind: "book", priority: 86, status: "target" },
  { phrase: "Rocky Mountains coffee table book", kind: "book", priority: 80, status: "target" },
  { phrase: "mountain coffee table book", kind: "book", priority: 68 },
  { phrase: "Colorado landscape photography book", kind: "book", priority: 74 },
  { phrase: "Colorado photo book", kind: "book", priority: 70 },
  { phrase: "Rocky Mountain photography book", kind: "book", priority: 66 },
  // Photography and the photographer
  { phrase: "Colorado landscape photographer", kind: "photography", priority: 62 },
  { phrase: "Colorado landscape photography prints", kind: "photography", priority: 60 },
  { phrase: "Boulder landscape photographer", kind: "photography", priority: 52 },
  { phrase: "Robert Castellino photography", kind: "photography", priority: 56, note: "His name: should always find him" },
  // Questions people ask
  { phrase: "best Colorado coffee table books", kind: "question", priority: 74 },
  { phrase: "what to give someone who loves the mountains", kind: "question", priority: 62 },
  { phrase: "best photography books of Colorado", kind: "question", priority: 60 },
];

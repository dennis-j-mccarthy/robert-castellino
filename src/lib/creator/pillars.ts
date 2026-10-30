/*
  Creator page — content pillars, core messages, audiences. CLIENT-SAFE:
  types, slug helpers and prompt helpers only (no Prisma, no JSON import).

  Reading pillars:
    server   src/lib/creator/pillar-store.ts  → loadPillars()
    browser  GET /api/creator/pillars

  Rows only store the `id` (SocialDraft.pillarId, LibraryTag.pillarId,
  EmailDraft.pillarId), so renaming a pillar never touches them.
*/

export type PillarId = string;

export interface Pillar {
  id: PillarId;
  name: string;
  /** One line: the brand message this pillar carries. */
  message: string;
  /** Angle prompts — starting points for a title or a caption. */
  angles: string[];
  /** Default hashtags. */
  hashtags: string[];
  /** Target share of the content mix, in percent (null = unset). */
  target: number | null;
  sortOrder: number;
  active: boolean;
}

/** One of Bob's ten core messages (stored as JSON on BrandEssence.messages). */
export interface CoreMessage {
  id: string;
  pillar: PillarId;
  text: string;
  captions: string[];
  headlines: string[];
}

/** A Meta audience (stored as JSON on BrandEssence.audiences; read-only here). */
export interface Audience {
  id: string;
  name: string;
  sizeNote: string;
  source: string;
  subtype: string;
  status: string;
  created: string;
  metaDef?: string;
  vb?: Record<string, string>;
}

export interface VoiceSliders {
  /** 0 = serious … 100 = playful */
  playful: number;
  /** 0 = casual … 100 = formal */
  formal: number;
  /** 0 = gentle … 100 = bold */
  bold: number;
}

export interface BrandEssenceRecord {
  line: string;
  purpose: string;
  promise: string;
  doList: string[];
  dontList: string[];
  voice: VoiceSliders;
  cta: string;
  messages: CoreMessage[];
  audiences: Audience[];
  updatedAt: string | null;
  /** true when this came from the database (vs. the seed defaults) */
  fromDb: boolean;
}

/* ───────── fixed facts (never invent around these) ───────── */

export const SITE = {
  name: "Robert Castellino Photography",
  short: "Robert Castellino",
  url: "https://robertcastellino.com",
  domain: "robertcastellino.com",
  location: "Lafayette, Colorado",
  bookPath: "/book",
  galleryPath: "/gallery",
  musingsPath: "/musings",
} as const;

export const BOOK = {
  title: "Colorado: Life & Light on the Land",
  plates: 84,
  pages: 116,
  printing: "first printing",
  price: "$49.95",
  facts: "84 plates · 116 pages · first printing · $49.95 signed",
} as const;

/* ───────── slug helpers ───────── */

export function slugifyPillarId(v: string): string {
  return v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function isValidPillarId(v: unknown): v is string {
  return typeof v === "string" && /^[a-z0-9][a-z0-9-]{1,39}$/.test(v);
}

/** A pillar id off the wire: the string when it looks like one, else null. */
export function cleanPillarId(v: unknown): string | null {
  return isValidPillarId(v) ? v : null;
}

/** Find a pillar in a list — tolerates unknown / legacy ids. */
export function pillarIn(list: Pillar[], id: string | null | undefined): Pillar | null {
  if (!id) return null;
  return list.find((p) => p.id === id) ?? null;
}

/** Pillar tint for small tags — one per slot, cycling (CSS classes in globals.css). */
export function pillarTagCls(index: number): string {
  const n = 5;
  return `cr-tag cr-tag--${((index % n) + n) % n}`;
}

export function pillarTagClsFor(list: Pillar[], id: string | null | undefined): string {
  const i = list.findIndex((p) => p.id === id);
  return pillarTagCls(i < 0 ? 0 : i);
}

/* ───────── prompt helpers ───────── */

/** One pillar as a labelled block — the message plus its angle prompts. */
export function pillarPrompt(p: Pillar, messages: CoreMessage[] = []): string {
  const mine = messages.filter((m) => m.pillar === p.id);
  return [
    `PILLAR: ${p.name}`,
    `MESSAGE IT CARRIES: ${p.message}`,
    mine.length
      ? `CORE MESSAGES UNDER THIS PILLAR:\n${mine.map((m) => `- ${m.text} (headlines: ${m.headlines.join(" / ")})`).join("\n")}`
      : "",
    p.angles.length ? `ANGLES TO DRAW FROM:\n${p.angles.map((a) => `- ${a}`).join("\n")}` : "",
    p.hashtags.length ? `DEFAULT HASHTAGS: ${p.hashtags.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

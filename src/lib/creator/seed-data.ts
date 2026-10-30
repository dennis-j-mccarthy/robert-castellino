/*
  Creator page — the seed defaults, derived from src/data/creator-seed.json
  (Bob's client record on the master Creator page, Oct 2026). SERVER ONLY:
  the JSON is ~55 KB and must not reach the browser.

  Everything the no-database path and scripts/seed-creator.ts need:
  essence, voice dials, CTA, five pillars, ten core messages, six
  audiences, the tone brief, and the 93 library tags.
*/

import seed from "@/data/creator-seed.json";
import type { Audience, BrandEssenceRecord, CoreMessage, Pillar, VoiceSliders } from "@/lib/creator/pillars";
import type { BlogTone } from "@/lib/creator/blog-tone";

type SeedAsset = {
  id: string;
  img: string;
  title: string;
  loc: string;
  blurb: string;
  pillar: string;
  msg: string;
  book: string | null;
  collection: string;
};

export const DEFAULT_VOICE: VoiceSliders = {
  playful: seed.voice.playful,
  formal: seed.voice.formal,
  bold: seed.voice.bold,
};

export const DEFAULT_MESSAGES: CoreMessage[] = seed.messages.map((m) => ({
  id: m.id,
  pillar: m.pillar,
  text: m.text,
  captions: m.captions,
  headlines: m.headlines,
}));

export const DEFAULT_AUDIENCES: Audience[] = seed.audiences.map((a) => ({
  id: a.id,
  name: a.name,
  sizeNote: a.sizeNote,
  source: a.source,
  subtype: a.subtype,
  status: a.status,
  created: a.created,
  metaDef: a.metaDef,
  vb: a.vb as Record<string, string> | undefined,
}));

export function defaultEssence(): BrandEssenceRecord {
  return {
    line: seed.essence.line,
    purpose: seed.essence.purpose,
    promise: seed.essence.promise,
    doList: [...seed.essence.doList],
    dontList: [...seed.essence.dontList],
    voice: { ...DEFAULT_VOICE },
    cta: seed.cta,
    messages: DEFAULT_MESSAGES.map((m) => ({ ...m, captions: [...m.captions], headlines: [...m.headlines] })),
    audiences: DEFAULT_AUDIENCES.map((a) => ({ ...a })),
    updatedAt: null,
    fromDb: false,
  };
}

const BASE_TAGS = seed.defaultTags.split(/\s+/).filter(Boolean);
const PILLAR_TAGS: Record<string, string[]> = {
  light: ["#GoldenHour", "#ColoradoLight", "#LandscapePhotography"],
  state: ["#VisitColorado", "#RockyMountains", "#ColoradoLandscape"],
  maker: ["#LargeFormat", "#FineArtPhotography", "#FiftyYears"],
  book: ["#PhotoBook", "#ColoradoBook", "#SignedCopy"],
  wall: ["#FineArtPrints", "#ArchivalPrints", "#WallArt"],
};
const PILLAR_MESSAGE: Record<string, string> = {
  light: "The light is the subject — the hour before the day decides what it will be",
  state: "Every plate is a real place in this state you could stand in yourself",
  maker: "One man, fifty years, every plate made by hand and signed by hand",
  book: "An heirloom, not a product — 84 plates, 116 pages, first printing, $49.95 signed",
  wall: "A morning you can hang in your home — archival, signed, editioned prints",
};

/** The five pillars, enriched from the core messages. */
export const DEFAULT_PILLARS: Pillar[] = seed.pillars.map((p, i) => {
  const mine = DEFAULT_MESSAGES.filter((m) => m.pillar === p.id);
  return {
    id: p.id,
    name: p.name,
    message: PILLAR_MESSAGE[p.id] ?? mine[0]?.text ?? p.name,
    angles: [...mine.map((m) => m.text), ...mine.flatMap((m) => m.headlines)],
    hashtags: [...BASE_TAGS, ...(PILLAR_TAGS[p.id] ?? [])],
    target: p.target ?? null,
    sortOrder: i,
    active: true,
  };
});

/** The tone brief for the Musings, derived from the essence. */
export const DEFAULT_TONE: BlogTone = {
  voice:
    "Unhurried, observational, quietly literary. First person, one maker. Grounded in a real place and a real hour. Mostly serious with a dry touch, a little formal, gently bold.",
  audience:
    "People who love Colorado's land and light — collectors, gift-givers, readers of the Musings. Skews 45+. They know the places; they want to see them the way they actually are.",
  style:
    "150–400 words, three to five paragraphs, no subheads. One place, one hour, one observation that pays back the early alarm. Ends quietly — never with a pitch.",
  dos: seed.essence.doList.join("; "),
  donts: seed.essence.dontList.join("; "),
};

export interface SeedLibraryTag {
  src: string;
  title: string;
  loc: string;
  blurb: string;
  pillarId: string;
  messageId: string;
  inBook: boolean;
  collection: string;
}

/** The 93 master-Creator-page assets, keyed by site path (`/assets/…`). */
export const DEFAULT_LIBRARY_TAGS: SeedLibraryTag[] = (seed.assets as SeedAsset[]).map((a) => ({
  src: "/" + a.img.replace(/^\/+/, ""),
  title: a.title,
  loc: a.loc,
  blurb: a.blurb,
  pillarId: a.pillar,
  messageId: a.msg,
  inBook: !!a.book,
  collection: a.collection,
}));

/** Musing id → pillar id, from the master page's mapping of his 30 Musings. */
export const MUSING_PILLARS: Record<string, string> = Object.fromEntries(
  seed.blogs.map((b) => [b.id, b.pillar]),
);

export const SEED_META = { name: seed.name, industry: seed.industry, mark: seed.mark, vlines: seed.vlines };

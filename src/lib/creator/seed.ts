import type { Prisma } from "@/generated/prisma/client";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  DEFAULT_AUDIENCES,
  DEFAULT_LIBRARY_TAGS,
  DEFAULT_MESSAGES,
  DEFAULT_PILLARS,
  DEFAULT_TONE,
  DEFAULT_VOICE,
  defaultEssence,
} from "@/lib/creator/seed-data";
import { normalizeSrc } from "@/lib/creator/library";
import adImages from "@/data/ad-images.json";

/*
  Seed the Creator page from src/data/creator-seed.json. IDEMPOTENT:
  rows are created when missing and left alone when present, so Bob's edits
  survive a re-run. `force` overwrites essence / pillars / tone / tags with
  the seed values. Used by scripts/seed-creator.ts, POST /api/creator/seed
  and ensureCreatorSeeded() (first visit).
*/

export interface SeedCounts {
  essence: "created" | "kept" | "overwritten";
  pillars: { created: number; kept: number; overwritten: number };
  tone: "created" | "kept" | "overwritten";
  tags: { created: number; kept: number; overwritten: number; unmatched: string[] };
}

export async function seedCreator(opts: { force?: boolean } = {}): Promise<SeedCounts> {
  const force = !!opts.force;
  const counts: SeedCounts = {
    essence: "kept",
    pillars: { created: 0, kept: 0, overwritten: 0 },
    tone: "kept",
    tags: { created: 0, kept: 0, overwritten: 0, unmatched: [] },
  };

  /* ── BrandEssence ── */
  const e = defaultEssence();
  const essenceData = {
    line: e.line,
    purpose: e.purpose,
    promise: e.promise,
    doList: e.doList,
    dontList: e.dontList,
    voicePlayful: DEFAULT_VOICE.playful,
    voiceFormal: DEFAULT_VOICE.formal,
    voiceBold: DEFAULT_VOICE.bold,
    cta: e.cta,
    messages: DEFAULT_MESSAGES as unknown as Prisma.InputJsonValue,
    audiences: DEFAULT_AUDIENCES as unknown as Prisma.InputJsonValue,
  };
  const hadEssence = await prisma.brandEssence.findUnique({ where: { id: "default" }, select: { id: true } });
  if (!hadEssence) {
    await prisma.brandEssence.create({ data: { id: "default", ...essenceData } });
    counts.essence = "created";
  } else if (force) {
    await prisma.brandEssence.update({ where: { id: "default" }, data: essenceData });
    counts.essence = "overwritten";
  }

  /* ── Pillars ── */
  for (const p of DEFAULT_PILLARS) {
    const data = { name: p.name, message: p.message, angles: p.angles, hashtags: p.hashtags, target: p.target, sortOrder: p.sortOrder, active: true };
    const had = await prisma.pillar.findUnique({ where: { id: p.id }, select: { id: true } });
    if (!had) {
      await prisma.pillar.create({ data: { id: p.id, ...data } });
      counts.pillars.created++;
    } else if (force) {
      await prisma.pillar.update({ where: { id: p.id }, data });
      counts.pillars.overwritten++;
    } else counts.pillars.kept++;
  }

  /* ── BlogSettings (tone) ── */
  const tone = DEFAULT_TONE as unknown as Prisma.InputJsonValue;
  const hadTone = await prisma.blogSettings.findUnique({ where: { id: "default" }, select: { id: true } });
  if (!hadTone) {
    await prisma.blogSettings.create({ data: { id: "default", tone } });
    counts.tone = "created";
  } else if (force) {
    await prisma.blogSettings.update({ where: { id: "default" }, data: { tone } });
    counts.tone = "overwritten";
  }

  /* ── Library tags: only for images that exist on the site ── */
  const known = new Set<string>((adImages as { src: string }[]).map((i) => normalizeSrc(i.src)));
  try {
    const photos = await prisma.photo.findMany({ select: { img: true } });
    for (const p of photos) known.add(normalizeSrc(p.img));
  } catch {
    /* manifest only */
  }
  const bookPages = new Map<string, number>();
  for (const i of adImages as { src: string; bookPage?: number }[]) if (i.bookPage) bookPages.set(normalizeSrc(i.src), i.bookPage);

  for (const t of DEFAULT_LIBRARY_TAGS) {
    const src = normalizeSrc(t.src);
    if (!known.has(src)) {
      counts.tags.unmatched.push(src);
      continue;
    }
    const data = {
      title: t.title,
      loc: t.loc,
      blurb: t.blurb,
      pillarId: t.pillarId,
      messageId: t.messageId,
      inBook: t.inBook || bookPages.has(src),
    };
    const had = await prisma.libraryTag.findUnique({ where: { src }, select: { src: true } });
    if (!had) {
      await prisma.libraryTag.create({ data: { src, ...data } });
      counts.tags.created++;
    } else if (force) {
      await prisma.libraryTag.update({ where: { src }, data });
      counts.tags.overwritten++;
    } else counts.tags.kept++;
  }

  return counts;
}

/**
 * First-visit safety net: when the database has no BrandEssence row yet,
 * seed everything once. Cheap (one indexed lookup) and never throws.
 */
export async function ensureCreatorSeeded(): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const row = await prisma.brandEssence.findUnique({ where: { id: "default" }, select: { id: true } });
    if (row) return;
    const c = await seedCreator();
    console.log(`[creator] seeded on first visit: pillars +${c.pillars.created}, tags +${c.tags.created}`);
  } catch (err) {
    console.error("[creator] ensureCreatorSeeded failed:", err);
  }
}

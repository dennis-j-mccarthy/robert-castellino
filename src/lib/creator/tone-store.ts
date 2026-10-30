import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cleanTone, type BlogTone } from "@/lib/creator/blog-tone";
import { DEFAULT_TONE } from "@/lib/creator/seed-data";

/*
  BlogSettings singleton (id "default") — the tone brief. SERVER ONLY.
  Without a database (or a row) the seed tone applies.
*/

const ID = "default";

export async function getTone(): Promise<{ tone: BlogTone; fromDb: boolean }> {
  if (!isDatabaseConfigured()) return { tone: { ...DEFAULT_TONE }, fromDb: false };
  try {
    const row = await prisma.blogSettings.findUnique({ where: { id: ID } });
    if (!row) return { tone: { ...DEFAULT_TONE }, fromDb: false };
    return { tone: cleanTone(row.tone), fromDb: true };
  } catch (err) {
    console.error("[creator/tone] read failed, using default:", err);
    return { tone: { ...DEFAULT_TONE }, fromDb: false };
  }
}

export async function saveTone(input: unknown): Promise<BlogTone> {
  const tone = cleanTone(input);
  const json = tone as unknown as Prisma.InputJsonValue;
  await prisma.blogSettings.upsert({ where: { id: ID }, create: { id: ID, tone: json }, update: { tone: json } });
  return tone;
}

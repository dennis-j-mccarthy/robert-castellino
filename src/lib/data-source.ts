/**
 * Data-source fallback layer.
 *
 * Public pages call these helpers instead of importing the static data
 * files directly. They check whether a database is configured AND has
 * content:
 *
 *   - DATABASE_URL is set AND the table has at least one published row →
 *     return DB rows
 *   - otherwise → return the static placeholders from src/data/*.ts
 *
 * This means the public site keeps working with no env vars set, and
 * starts reading from the DB as soon as it is provisioned and seeded.
 *
 * IMPORTANT: do not import this file into client components — it
 * touches Prisma. It is server-only.
 */

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import {
  MUSINGS as STATIC_MUSINGS,
  CAT_META,
  type Musing,
  type MusingCategory,
} from "@/data/musings";
import {
  COLLECTIONS as STATIC_COLLECTIONS,
  type Collection,
  type Photo,
} from "@/data/collections";

export { CAT_META };
export type { Musing, MusingCategory, Collection, Photo };

// ───────── MUSINGS ─────────

export async function getAllMusings(): Promise<Musing[]> {
  if (!isDatabaseConfigured()) return STATIC_MUSINGS;
  try {
    const rows = await prisma.musing.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    if (rows.length === 0) return STATIC_MUSINGS;
    return rows.map((r) => ({
      id: r.id,
      num: r.num,
      cat: r.cat as MusingCategory,
      title: r.title,
      date: r.date,
      loc: r.loc ?? undefined,
      img: r.img ?? undefined,
      size: (r.size as "sm" | "md" | "lg" | undefined) ?? undefined,
      excerpt: r.excerpt,
      body: r.body,
    }));
  } catch {
    return STATIC_MUSINGS;
  }
}

export async function getMusing(id: string): Promise<Musing | undefined> {
  const all = await getAllMusings();
  return all.find((m) => m.id === id);
}

export async function getMusingNeighbors(
  id: string,
): Promise<{ prev: Musing; next: Musing } | undefined> {
  const all = await getAllMusings();
  const idx = all.findIndex((m) => m.id === id);
  if (idx === -1) return undefined;
  return {
    prev: all[(idx - 1 + all.length) % all.length],
    next: all[(idx + 1) % all.length],
  };
}

// ───────── COLLECTIONS ─────────

export async function getAllCollections(): Promise<Collection[]> {
  if (!isDatabaseConfigured()) return STATIC_COLLECTIONS;
  try {
    const rows = await prisma.collection.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        photos: { orderBy: { order: "asc" } },
      },
    });
    if (rows.length === 0) return STATIC_COLLECTIONS;
    return rows.map((c) => ({
      slug: c.slug,
      label: c.label,
      intro: c.intro,
      photos: c.photos.map((p) => ({
        img: p.img,
        title: p.title,
        loc: p.loc,
        blurb: p.blurb,
      })),
    }));
  } catch {
    return STATIC_COLLECTIONS;
  }
}

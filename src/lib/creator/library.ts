import adImages from "@/data/ad-images.json";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { SITE } from "@/lib/creator/pillars";

/*
  The Creator-page library — a VIEW, not a store. SERVER ONLY.

  No bytes and no uploads live here. Items are the union of
    · src/data/ad-images.json   (the committed manifest; `bookPage` marks the
                                 17 plates verified to be in the book)
    · Photo rows                (the gallery, managed in /admin/collections)
  enriched by LibraryTag rows (pillar, core message, title, blurb — seeded
  from the 93 master-Creator-page assets). Mockups are flagged and are
  never ad-eligible.
*/

/** The AI book renders — banned from ads and posts, always. */
export const MOCKUP_RE = /book-cover|book-table|gift-series|mockup/i;

export function isMockup(src: string): boolean {
  return MOCKUP_RE.test(src);
}

export interface LibraryItem {
  /** Site path (`/assets/…`) or absolute URL — the identity of the item. */
  src: string;
  /** Absolute https URL Meta can fetch. */
  url: string;
  label: string;
  collection: string;
  /** Page in the book's print PDF, when this plate is in it. */
  bookPage: number | null;
  inBook: boolean;
  mockup: boolean;
  /** Safe to use in ads and posts (never a mockup). */
  adEligible: boolean;
  title: string | null;
  loc: string | null;
  blurb: string | null;
  pillarId: string | null;
  messageId: string | null;
  source: "manifest" | "photo" | "both";
}

export interface LibraryView {
  items: LibraryItem[];
  collections: { slug: string; label: string; count: number }[];
  counts: { total: number; inBook: number; mockups: number; adEligible: number; tagged: number };
}

type ManifestEntry = { src: string; collection: string; label: string; bookPage?: number };

export function absoluteImageUrl(u: string): string {
  const s = u.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${SITE.url}${s.startsWith("/") ? "" : "/"}${s}`;
}

/** `/assets/…` for anything on this site, so manifest, Photo and tag rows agree. */
export function normalizeSrc(u: string): string {
  const s = u.trim();
  const m = s.match(/^https?:\/\/(?:www\.)?robertcastellino\.com(\/.*)$/i);
  if (m) return m[1];
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

const prettyLabel = (src: string) =>
  (src.split("/").pop() ?? src).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");

export async function loadLibrary(): Promise<LibraryView> {
  const bySrc = new Map<string, LibraryItem>();

  for (const e of adImages as ManifestEntry[]) {
    const src = normalizeSrc(e.src);
    bySrc.set(src, {
      src,
      url: absoluteImageUrl(src),
      label: e.label,
      collection: e.collection,
      bookPage: e.bookPage ?? null,
      inBook: !!e.bookPage,
      mockup: isMockup(src),
      adEligible: !isMockup(src),
      title: null,
      loc: null,
      blurb: null,
      pillarId: null,
      messageId: null,
      source: "manifest",
    });
  }

  const collectionLabels = new Map<string, string>();
  if (isDatabaseConfigured()) {
    try {
      const [photos, tags] = await Promise.all([
        prisma.photo.findMany({
          include: { collection: { select: { slug: true, label: true } } },
          orderBy: [{ collectionId: "asc" }, { order: "asc" }],
        }),
        prisma.libraryTag.findMany(),
      ]);
      for (const p of photos) {
        collectionLabels.set(p.collection.slug, p.collection.label);
        const src = normalizeSrc(p.img);
        const prev = bySrc.get(src);
        if (prev) {
          prev.source = "both";
          prev.title = prev.title ?? p.title;
          prev.loc = prev.loc ?? p.loc;
          prev.blurb = prev.blurb ?? p.blurb;
          continue;
        }
        bySrc.set(src, {
          src,
          url: absoluteImageUrl(src),
          label: p.title || prettyLabel(src),
          collection: p.collection.slug,
          bookPage: null,
          inBook: false,
          mockup: isMockup(src),
          adEligible: !isMockup(src),
          title: p.title,
          loc: p.loc,
          blurb: p.blurb,
          pillarId: null,
          messageId: null,
          source: "photo",
        });
      }
      for (const t of tags) {
        const it = bySrc.get(normalizeSrc(t.src));
        if (!it) continue;
        it.title = t.title ?? it.title;
        it.loc = t.loc ?? it.loc;
        it.blurb = t.blurb ?? it.blurb;
        it.pillarId = t.pillarId;
        it.messageId = t.messageId;
        // `inBook` stays what the manifest's verified `bookPage` says; a tag's
        // flag is informational and never promotes a plate into the book set.
      }
    } catch (err) {
      console.error("[creator/library] db read failed; manifest only:", err);
    }
  }

  const items = Array.from(bySrc.values()).sort((a, b) => {
    if (a.inBook !== b.inBook) return a.inBook ? -1 : 1;
    if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
    return a.label.localeCompare(b.label);
  });

  const collCounts = new Map<string, number>();
  for (const it of items) collCounts.set(it.collection, (collCounts.get(it.collection) ?? 0) + 1);
  const collections = Array.from(collCounts.entries()).map(([slug, count]) => ({
    slug,
    label: collectionLabels.get(slug) ?? slug.replace(/-/g, " "),
    count,
  }));

  return {
    items,
    collections,
    counts: {
      total: items.length,
      inBook: items.filter((i) => i.inBook).length,
      mockups: items.filter((i) => i.mockup).length,
      adEligible: items.filter((i) => i.adEligible).length,
      tagged: items.filter((i) => i.pillarId).length,
    },
  };
}

/** Upsert the enrichment for one item (pillar / message / title / blurb / loc). */
export async function saveLibraryTag(input: {
  src: string;
  pillarId?: string | null;
  messageId?: string | null;
  title?: string | null;
  blurb?: string | null;
  loc?: string | null;
}) {
  const src = normalizeSrc(input.src);
  const data = {
    ...(input.pillarId !== undefined ? { pillarId: input.pillarId || null } : {}),
    ...(input.messageId !== undefined ? { messageId: input.messageId || null } : {}),
    ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
    ...(input.blurb !== undefined ? { blurb: input.blurb?.trim() || null } : {}),
    ...(input.loc !== undefined ? { loc: input.loc?.trim() || null } : {}),
  };
  return prisma.libraryTag.upsert({ where: { src }, create: { src, ...data }, update: data });
}

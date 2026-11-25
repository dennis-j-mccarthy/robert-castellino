import adImages from "@/data/ad-images.json";
import { MUSINGS as STATIC_MUSINGS } from "@/data/musings";
import { getSession } from "@/lib/auth";
import { getAllMusings, getMusing } from "@/lib/data-source";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { generateIdAndNum } from "@/lib/musing-ids";
import { rowToMusing } from "@/lib/data-source";
import { onMusingPublished, revalidateMusings } from "@/lib/publish-hooks";
import type { StudioAdapters, ContentPost, SitePicture } from "@/lib/creator/studio-adapters";
import { studio } from "@/studio.config";

/*
  Robert Castellino — how the shared studio reaches this site's own data.
  Content = Musing rows (static fallback), pictures = the committed ad-image
  manifest + Photo rows, uploads = /api/admin/upload (Postgres-stored
  images), subscribers = Subscriber rows, auth = the admin cookie.
*/

type ManifestEntry = { src: string; label: string; collection: string; bookPage?: number | null };

const strip = (s: string) => s.replace(/<[^>]+>/g, "");

function toPost(m: { id: string; title: string; date: string; img?: string | null; excerpt: string; body: string[]; loc?: string | null; published?: boolean; starred?: boolean; createdAt?: string | null; updatedAt?: string | null }): ContentPost {
  return { id: m.id, title: m.title, date: m.date, img: m.img ?? null, excerpt: strip(m.excerpt), paragraphs: m.body.map(strip), loc: m.loc ?? null, published: m.published ?? true, starred: m.starred ?? false, createdAt: m.createdAt ?? null, updatedAt: m.updatedAt ?? null };
}

export const adapters: StudioAdapters = {
  content: {
    async list() {
      if (!isDatabaseConfigured()) return STATIC_MUSINGS.map((m) => toPost({ ...m, published: true, starred: false }));
      const rows = await prisma.musing.findMany({ orderBy: [{ updatedAt: "desc" }] }).catch(() => []);
      if (!rows.length) return (await getAllMusings()).map((m) => toPost(m));
      return rows.map((r) => toPost({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
    },
    async get(id) {
      const m = await getMusing(id);
      return m ? toPost(m) : null;
    },
    async create(input) {
      const cat = (studio.brand.blog.categories ?? []).some((c) => c.id === input.category) ? (input.category as string) : "reflections";
      const { id, num } = await generateIdAndNum();
      const row = await prisma.musing.create({
        data: { id, num, title: input.title, excerpt: input.excerpt, body: input.paragraphs, img: input.img, loc: input.loc, cat: cat as never, published: input.published, date: input.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
      });
      if (row.published) { revalidateMusings(row.id); void onMusingPublished(rowToMusing(row)); }
      return { id: row.id };
    },
    async update(id, input) {
      const cat = (studio.brand.blog.categories ?? []).some((c) => c.id === input.category) ? (input.category as string) : undefined;
      const row = await prisma.musing.update({
        where: { id },
        data: { title: input.title, excerpt: input.excerpt, body: input.paragraphs, img: input.img, loc: input.loc, ...(cat ? { cat: cat as never } : {}), published: input.published, ...(input.date ? { date: input.date } : {}) },
      });
      revalidateMusings(row.id);
      if (row.published) void onMusingPublished(rowToMusing(row));
    },
    async setPublished(id, published) { await prisma.musing.update({ where: { id }, data: { published } }); },
    async setStarred(id, starred) { await prisma.musing.update({ where: { id }, data: { starred } }); },
    url: (id) => `${studio.site.url}${studio.brand.blog.path}/${id}`,
  },
  pictures: {
    mockupPattern: /book-cover|book-table|gift-series|mockup/i,
    normalize(u) {
      const s = u.trim();
      const m = s.match(/^https?:\/\/(?:www\.)?robertcastellino\.com(\/.*)$/i);
      if (m) return m[1];
      if (/^https?:\/\//i.test(s)) return s;
      return s.startsWith("/") ? s : `/${s}`;
    },
    async list() {
      const out: SitePicture[] = (adImages as ManifestEntry[]).map((e) => ({ src: e.src, label: e.label, collection: e.collection, bookPage: e.bookPage ?? null }));
      if (isDatabaseConfigured()) {
        const photos = await prisma.photo.findMany({ include: { collection: { select: { slug: true } } }, orderBy: [{ collectionId: "asc" }, { order: "asc" }] }).catch(() => []);
        for (const p of photos) out.push({ src: p.img, label: p.title || p.img, collection: p.collection.slug, title: p.title, loc: p.loc, blurb: p.blurb });
      }
      return out;
    },
  },
  uploads: {
    async upload() { throw new Error("Uploads go through /api/admin/upload on this site."); },
  },
  subscribers: {
    async count() {
      if (!isDatabaseConfigured()) return null;
      return prisma.subscriber.count({ where: { active: true } }).catch(() => null);
    },
  },
  auth: { getSession, logoutPath: "/api/admin/logout" },
};

import adImages from "@/data/ad-images.json";
import { MUSINGS as STATIC_MUSINGS } from "@/data/musings";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
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

// Site modules are imported lazily inside the functions: this file is imported
// by shared code at module-init time, and eager imports here would create
// import cycles (adapters → publish hooks → creator libs → adapters) that the
// production bundle resolves as "Cannot access before initialization".
const ds = () => import("@/lib/data-source");
const hooks = () => import("@/lib/publish-hooks");

export const adapters: StudioAdapters = {
  seed: async () => (await import("@/studio-site/seed")).ensureCreatorSeeded(),
  content: {
    async list() {
      if (!isDatabaseConfigured()) return STATIC_MUSINGS.map((m) => toPost({ ...m, published: true, starred: false }));
      const rows = await prisma.musing.findMany({ orderBy: [{ updatedAt: "desc" }] }).catch(() => []);
      if (!rows.length) return (await (await ds()).getAllMusings()).map((m) => toPost(m));
      return rows.map((r) => toPost({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
    },
    async get(id) {
      const m = await (await ds()).getMusing(id);
      return m ? toPost(m) : null;
    },
    async create(input) {
      const cat = (studio.brand.blog.categories ?? []).some((c) => c.id === input.category) ? (input.category as string) : "reflections";
      const { generateIdAndNum } = await import("@/lib/musing-ids");
      const { id, num } = await generateIdAndNum();
      const row = await prisma.musing.create({
        data: { id, num, title: input.title, excerpt: input.excerpt, body: input.paragraphs, img: input.img, loc: input.loc, cat: cat as never, published: input.published, date: input.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
      });
      if (row.published) { const [h, d] = await Promise.all([hooks(), ds()]); h.revalidateMusings(row.id); void h.onMusingPublished(d.rowToMusing(row)); }
      return { id: row.id };
    },
    async update(id, input) {
      const cat = (studio.brand.blog.categories ?? []).some((c) => c.id === input.category) ? (input.category as string) : undefined;
      const row = await prisma.musing.update({
        where: { id },
        data: { title: input.title, excerpt: input.excerpt, body: input.paragraphs, img: input.img, loc: input.loc, ...(cat ? { cat: cat as never } : {}), published: input.published, ...(input.date ? { date: input.date } : {}) },
      });
      const [h, d] = await Promise.all([hooks(), ds()]);
      h.revalidateMusings(row.id);
      if (row.published) void h.onMusingPublished(d.rowToMusing(row));
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
    async add(input) {
      const SLUG = "studio-uploads";
      const collection = await prisma.collection.upsert({ where: { slug: SLUG }, create: { slug: SLUG, label: "Studio uploads", intro: "Pictures added from the creator studio.", published: false, order: 999 }, update: {} });
      const count = await prisma.photo.count({ where: { collectionId: collection.id } });
      const title = (input.title || `Upload ${count + 1}`).slice(0, 120);
      const photo = await prisma.photo.create({ data: { collectionId: collection.id, img: input.url, title, loc: "", blurb: input.generated ? "Generated image — not a plate." : "", order: count } });
      return { src: photo.img, title: photo.title };
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
    async upload(file) { return (await import("@/lib/image-store")).storeImage(file); },
  },
  subscribers: {
    async count() {
      if (!isDatabaseConfigured()) return null;
      return prisma.subscriber.count({ where: { active: true } }).catch(() => null);
    },
    async stats(since) {
      if (!isDatabaseConfigured()) return null;
      const [total, confirmed, last30] = await Promise.all([
        prisma.subscriber.count({ where: { active: true } }),
        prisma.subscriber.count({ where: { active: true, confirmed: true } }),
        prisma.subscriber.count({ where: { active: true, createdAt: { gte: since } } }),
      ]);
      return { total, confirmed, last30 };
    },
  },
  auth: { getSession, logoutPath: "/api/admin/logout" },
  notify: {
    async sendEmail({ to, subject, text, html }) {
      const from = process.env.CONTACT_FROM_EMAIL;
      const key = process.env.RESEND_API_KEY;
      if (!from || !key) return false;
      const { Resend } = await import("resend");
      await new Resend(key).emails.send({ from, to, subject, text, html });
      return true;
    },
  },
};

import type { MetadataRoute } from "next";
import { getAllMusings } from "@/lib/data-source";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

const base = "https://robertcastellino.com";

// Reads published musings from the DB (falls back to static data), so a newly
// published post appears without a rebuild. Keep it uncached.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    "",
    "/gallery",
    "/book",
    "/about",
    "/timeline",
    "/musings",
    "/contact",
  ].map((p) => ({
    url: base + p,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  let posts: MetadataRoute.Sitemap = [];
  try {
    const musings = await getAllMusings();
    posts = musings.map((m) => ({
      url: `${base}/musings/${m.id}`,
      lastModified: m.updatedAt ? new Date(m.updatedAt) : now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));
  } catch {
    posts = [];
  }

  // Landing pages appear only once published (drafts are noindex).
  let landing: MetadataRoute.Sitemap = [];
  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.landingPage.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
      landing = rows.map((r) => ({ url: `${base}/for/${r.slug}`, lastModified: r.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 }));
    } catch {
      landing = [];
    }
  }

  return [...routes, ...landing, ...posts];
}

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://robertcastellino.com";
  const now = new Date();
  const routes = ["", "/gallery", "/book", "/about", "/timeline", "/musings", "/contact"];
  return routes.map((p) => ({
    url: base + p,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
}

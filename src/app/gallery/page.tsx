import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { COLLECTIONS } from "@/data/collections";
import GalleryClient, { type CollectionData } from "./GalleryClient";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  let collections: CollectionData[] = COLLECTIONS.map((c) => ({
    slug: c.slug,
    label: c.label,
    intro: c.intro,
    photos: c.photos.map((p) => ({ img: p.img, title: p.title, loc: p.loc, blurb: p.blurb })),
  }));

  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.collection.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
        include: { photos: { orderBy: { order: "asc" } } },
      });
      if (rows.length > 0) {
        collections = rows.map((c) => ({
          slug: c.slug,
          label: c.label,
          intro: c.intro,
          photos: c.photos.map((p) => ({ img: p.img, title: p.title, loc: p.loc, blurb: p.blurb })),
        }));
      }
    } catch {
      // DB unavailable — static fallback already set above
    }
  }

  return <GalleryClient collections={collections} />;
}

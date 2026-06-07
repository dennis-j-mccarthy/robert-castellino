import { isDatabaseConfigured } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { COLLECTIONS } from "@/data/collections";
import CollectionsCRUD from "./CollectionsCRUD";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  let items: {
    id: string;
    slug: string;
    label: string;
    intro: string;
    order: number;
    published: boolean;
    photos: { id: string; collectionId: string; img: string; title: string; loc: string; blurb: string; order: number }[];
  }[] = [];
  let dbMissing = false;

  if (!isDatabaseConfigured()) {
    items = COLLECTIONS.map((c, i) => ({
      id: c.slug,
      slug: c.slug,
      label: c.label,
      intro: c.intro,
      order: i,
      published: true,
      photos: c.photos.map((p, j) => ({
        id: `${c.slug}-${j}`,
        collectionId: c.slug,
        img: p.img,
        title: p.title,
        loc: p.loc,
        blurb: p.blurb,
        order: j,
      })),
    }));
    dbMissing = true;
  } else {
    try {
      const rows = await prisma.collection.findMany({
        orderBy: { order: "asc" },
        include: { photos: { orderBy: { order: "asc" } } },
      });
      if (rows.length === 0) {
        items = COLLECTIONS.map((c, i) => ({
          id: c.slug,
          slug: c.slug,
          label: c.label,
          intro: c.intro,
          order: i,
          published: true,
          photos: c.photos.map((p, j) => ({
            id: `${c.slug}-${j}`,
            collectionId: c.slug,
            img: p.img,
            title: p.title,
            loc: p.loc,
            blurb: p.blurb,
            order: j,
          })),
        }));
      } else {
        items = rows;
      }
    } catch {
      items = COLLECTIONS.map((c, i) => ({
        id: c.slug,
        slug: c.slug,
        label: c.label,
        intro: c.intro,
        order: i,
        published: true,
        photos: c.photos.map((p, j) => ({
          id: `${c.slug}-${j}`,
          collectionId: c.slug,
          img: p.img,
          title: p.title,
          loc: p.loc,
          blurb: p.blurb,
          order: j,
        })),
      }));
      dbMissing = true;
    }
  }

  return <CollectionsCRUD initial={items} dbMissing={dbMissing} />;
}

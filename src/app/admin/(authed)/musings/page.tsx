import { isDatabaseConfigured } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { MUSINGS } from "@/data/musings";
import MusingsCRUD from "./MusingsCRUD";

export const dynamic = "force-dynamic";

export default async function AdminMusingsPage() {
  let items: typeof MUSINGS = [];
  let dbMissing = false;

  if (!isDatabaseConfigured()) {
    items = MUSINGS;
    dbMissing = true;
  } else {
    try {
      const rows = await prisma.musing.findMany({
        orderBy: [{ order: "asc" }, { id: "asc" }],
      });
      if (rows.length === 0) {
        items = MUSINGS;
        dbMissing = false;
      } else {
        items = rows.map(r => ({
          id: r.id,
          num: r.num,
          cat: r.cat as typeof MUSINGS[0]["cat"],
          title: r.title,
          date: r.date,
          loc: r.loc ?? undefined,
          img: r.img ?? undefined,
          size: (r.size ?? undefined) as typeof MUSINGS[0]["size"],
          excerpt: r.excerpt,
          body: r.body,
        }));
      }
    } catch {
      items = MUSINGS;
      dbMissing = true;
    }
  }

  const serializable = items.map(m => ({
    id: m.id,
    num: m.num,
    cat: m.cat as string,
    title: m.title,
    date: m.date,
    loc: m.loc ?? null,
    img: m.img ?? null,
    size: m.size ?? null,
    excerpt: m.excerpt,
    body: m.body,
    published: true,
    order: 0,
  }));

  return <MusingsCRUD initial={serializable} dbMissing={dbMissing} />;
}

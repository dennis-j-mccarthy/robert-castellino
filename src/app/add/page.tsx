import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { COLLECTIONS } from "@/data/collections";
import AddClient, { type CollectionOption } from "./AddClient";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/add");

  let collections: CollectionOption[] = [];

  if (isDatabaseConfigured()) {
    try {
      const rows = await prisma.collection.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
        include: { _count: { select: { photos: true } } },
      });
      if (rows.length > 0) {
        collections = rows.map(c => ({
          id: c.id,
          slug: c.slug,
          label: c.label,
          nextOrder: c._count.photos,
        }));
      }
    } catch {
      // fall through to static
    }
  }

  // Static fallback (DB empty or not configured) — use slug as id,
  // seed button on /admin will fix this
  if (collections.length === 0) {
    collections = COLLECTIONS.map((c, i) => ({
      id: c.slug,
      slug: c.slug,
      label: c.label,
      nextOrder: c.photos.length,
    }));
  }

  return <AddClient collections={collections} />;
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { MUSINGS } from "@/data/musings";
import { COLLECTIONS } from "@/data/collections";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  // Only seed if tables are empty — never overwrite existing data
  const [musingCount, collectionCount] = await Promise.all([
    prisma.musing.count(),
    prisma.collection.count(),
  ]);

  const results: { musings: number; collections: number; photos: number } = {
    musings: 0,
    collections: 0,
    photos: 0,
  };

  if (musingCount === 0) {
    for (let i = 0; i < MUSINGS.length; i++) {
      const m = MUSINGS[i];
      await prisma.musing.create({
        data: {
          id: m.id,
          num: m.num,
          cat: m.cat,
          title: m.title,
          date: m.date,
          loc: m.loc ?? null,
          img: m.img ?? null,
          size: m.size ?? null,
          excerpt: m.excerpt,
          body: m.body,
          published: true,
          order: i,
        },
      });
      results.musings++;
    }
  }

  if (collectionCount === 0) {
    for (let i = 0; i < COLLECTIONS.length; i++) {
      const c = COLLECTIONS[i];
      const collection = await prisma.collection.create({
        data: {
          slug: c.slug,
          label: c.label,
          intro: c.intro,
          order: i,
          published: true,
        },
      });
      results.collections++;

      for (let j = 0; j < c.photos.length; j++) {
        const p = c.photos[j];
        await prisma.photo.create({
          data: {
            collectionId: collection.id,
            img: p.img,
            title: p.title,
            loc: p.loc,
            blurb: p.blurb,
            order: j,
          },
        });
        results.photos++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    seeded: results,
    skipped: {
      musings: musingCount > 0,
      collections: collectionCount > 0,
    },
  });
}

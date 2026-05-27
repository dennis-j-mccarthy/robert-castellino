/**
 * Mirror the static data files into the live database.
 *
 * Run with: npm run db:seed
 *
 * - Idempotent: upserts by stable key (musing.id, collection.slug).
 * - Photos are wiped and re-inserted per collection on each seed so that
 *   the static data file is treated as source of truth until Bob takes
 *   over via /admin.
 *
 * After Bob starts using /admin to edit, do NOT re-seed — it would clobber
 * his edits.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MUSINGS } from "../src/data/musings";
import { COLLECTIONS } from "../src/data/collections";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  console.log("→ Seeding musings…");
  for (let i = 0; i < MUSINGS.length; i++) {
    const m = MUSINGS[i];
    await prisma.musing.upsert({
      where: { id: m.id },
      create: {
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
      update: {
        num: m.num,
        cat: m.cat,
        title: m.title,
        date: m.date,
        loc: m.loc ?? null,
        img: m.img ?? null,
        size: m.size ?? null,
        excerpt: m.excerpt,
        body: m.body,
        order: i,
      },
    });
  }
  console.log(`  ${MUSINGS.length} musings upserted.`);

  console.log("→ Seeding collections…");
  for (let i = 0; i < COLLECTIONS.length; i++) {
    const c = COLLECTIONS[i];
    const collection = await prisma.collection.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        label: c.label,
        intro: c.intro,
        order: i,
        published: true,
      },
      update: {
        label: c.label,
        intro: c.intro,
        order: i,
      },
    });
    // Replace photos for this collection.
    await prisma.photo.deleteMany({ where: { collectionId: collection.id } });
    if (c.photos.length > 0) {
      await prisma.photo.createMany({
        data: c.photos.map((p, j) => ({
          collectionId: collection.id,
          img: p.img,
          title: p.title,
          loc: p.loc,
          blurb: p.blurb,
          order: j,
        })),
      });
    }
    console.log(`  ${c.slug}: ${c.photos.length} photos`);
  }

  await prisma.$disconnect();
  console.log("✓ Seed complete.");
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});

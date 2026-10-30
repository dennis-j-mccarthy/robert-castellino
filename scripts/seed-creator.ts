/*
  Seed the Creator page (/creator). IDEMPOTENT — rows are created when
  missing and left alone when present (Bob's edits survive a re-run);
  pass --force to overwrite with the seed values.

    DATABASE_URL=… npx tsx scripts/seed-creator.ts            # reads .env.local too
    DATABASE_URL=… npx tsx scripts/seed-creator.ts --force

  Seeds (from src/data/creator-seed.json): BrandEssence (line / purpose /
  promise / do / don't / voice dials / CTA / 10 core messages / 6
  audiences), the five Pillars, the BlogSettings tone brief, and the
  LibraryTag enrichment for the 93 master-page assets (only those that
  exist on the site). Never prints secrets.

  The same seed also runs from POST /api/creator/seed (admin session) and on
  the first visit to /creator when the tables are still empty — handy for
  production, where DATABASE_URL is a sensitive Vercel variable.
*/
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — nothing seeded.");
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  // Dynamic imports so dotenv has run before src/lib/prisma.ts reads the env.
  const { seedCreator } = await import("../src/lib/creator/seed");
  const { prisma } = await import("../src/lib/prisma");

  const c = await seedCreator({ force });
  const [essence, pillars, tags, tone] = await Promise.all([
    prisma.brandEssence.count(),
    prisma.pillar.count(),
    prisma.libraryTag.count(),
    prisma.blogSettings.count(),
  ]);
  console.log(
    [
      `essence: ${c.essence}`,
      `pillars: +${c.pillars.created} kept ${c.pillars.kept} overwritten ${c.pillars.overwritten}`,
      `tone: ${c.tone}`,
      `library tags: +${c.tags.created} kept ${c.tags.kept} overwritten ${c.tags.overwritten} unmatched ${c.tags.unmatched.length}`,
    ].join("\n"),
  );
  if (c.tags.unmatched.length) console.log(`  unmatched (not on the site): ${c.tags.unmatched.join(", ")}`);
  console.log(`totals: BrandEssence=${essence} Pillar=${pillars} BlogSettings=${tone} LibraryTag=${tags}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

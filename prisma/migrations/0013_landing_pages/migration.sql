-- Search → Landing pages: one page per search phrase at /for/<slug>.
ALTER TABLE "Keyword" ADD COLUMN "landingSlug" TEXT;

CREATE TABLE "LandingPage" (
  "slug" TEXT NOT NULL,
  "keyword" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL DEFAULT '',
  "h1" TEXT NOT NULL,
  "intro" TEXT NOT NULL DEFAULT '',
  "body" TEXT NOT NULL,
  "faq" JSONB,
  "heroImage" TEXT,
  "heroAlt" TEXT,
  "sections" JSONB,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("slug")
);

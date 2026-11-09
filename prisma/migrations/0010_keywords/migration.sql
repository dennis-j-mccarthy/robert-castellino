-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'gift',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_phrase_key" ON "Keyword"("phrase");

-- CreateIndex
CREATE INDEX "Keyword_kind_priority_idx" ON "Keyword"("kind", "priority");

-- Seed (src/lib/creator/keywords.ts SEED_KEYWORDS)
INSERT INTO "Keyword" ("id", "phrase", "kind", "priority", "status", "source", "note", "updatedAt") VALUES
('colorado-gifts', 'Colorado gifts', 'gift', 88, 'target', 'seed', 'Holiday timing: mid-Nov to Dec 15', CURRENT_TIMESTAMP),
('colorado-christmas-gifts', 'Colorado Christmas gifts', 'gift', 84, 'target', 'seed', 'Holiday timing', CURRENT_TIMESTAMP),
('gifts-for-someone-who-loves-colorado', 'gifts for someone who loves Colorado', 'gift', 80, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('mountain-gifts', 'mountain gifts', 'gift', 72, 'idea', 'seed', 'Holiday timing', CURRENT_TIMESTAMP),
('gifts-for-hikers', 'gifts for hikers', 'gift', 64, 'idea', 'seed', 'Holiday timing', CURRENT_TIMESTAMP),
('signed-photography-book-gift', 'signed photography book gift', 'gift', 70, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('housewarming-gift-colorado', 'housewarming gift Colorado', 'gift', 60, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('gift-for-someone-moving-away-from-colorado', 'gift for someone moving away from Colorado', 'gift', 58, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('colorado-coffee-table-book', 'Colorado coffee table book', 'book', 86, 'target', 'seed', NULL, CURRENT_TIMESTAMP),
('rocky-mountains-coffee-table-book', 'Rocky Mountains coffee table book', 'book', 80, 'target', 'seed', NULL, CURRENT_TIMESTAMP),
('mountain-coffee-table-book', 'mountain coffee table book', 'book', 68, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('colorado-landscape-photography-book', 'Colorado landscape photography book', 'book', 74, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('colorado-photo-book', 'Colorado photo book', 'book', 70, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('rocky-mountain-photography-book', 'Rocky Mountain photography book', 'book', 66, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('colorado-landscape-photographer', 'Colorado landscape photographer', 'photography', 62, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('colorado-landscape-photography-prints', 'Colorado landscape photography prints', 'photography', 60, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('boulder-landscape-photographer', 'Boulder landscape photographer', 'photography', 52, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('robert-castellino-photography', 'Robert Castellino photography', 'photography', 56, 'idea', 'seed', 'His name: should always find him', CURRENT_TIMESTAMP),
('best-colorado-coffee-table-books', 'best Colorado coffee table books', 'question', 74, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('what-to-give-someone-who-loves-the-mountains', 'what to give someone who loves the mountains', 'question', 62, 'idea', 'seed', NULL, CURRENT_TIMESTAMP),
('best-photography-books-of-colorado', 'best photography books of Colorado', 'question', 60, 'idea', 'seed', NULL, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

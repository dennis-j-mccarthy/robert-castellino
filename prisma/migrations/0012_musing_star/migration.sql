-- Blog cards: a star marks a Musing to include in the next newsletter.
ALTER TABLE "Musing" ADD COLUMN "starred" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GiftDraft" (
    "id" TEXT NOT NULL,
    "edits" JSONB NOT NULL,
    "images" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftDraft_pkey" PRIMARY KEY ("id")
);

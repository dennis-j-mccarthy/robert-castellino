-- CreateTable
CREATE TABLE "AdDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT,
    "message" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "ctaType" TEXT NOT NULL DEFAULT 'SHOP_NOW',
    "campaignId" TEXT,
    "adsetId" TEXT,
    "creativeId" TEXT,
    "metaAdId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "error" TEXT,
    "previewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdDraft_status_createdAt_idx" ON "AdDraft"("status", "createdAt");

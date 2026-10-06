-- CreateTable
CREATE TABLE "SocialDraft" (
    "id" TEXT NOT NULL,
    "musingId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT,
    "link" TEXT NOT NULL,
    "image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialDraft_status_createdAt_idx" ON "SocialDraft"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialDraft_musingId_platform_key" ON "SocialDraft"("musingId", "platform");


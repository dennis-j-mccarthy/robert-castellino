-- AlterTable
ALTER TABLE "SocialDraft" ADD COLUMN     "error" TEXT,
ADD COLUMN     "metaPostId" TEXT,
ADD COLUMN     "pillarId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BrandEssence" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "line" TEXT NOT NULL DEFAULT '',
    "purpose" TEXT NOT NULL DEFAULT '',
    "promise" TEXT NOT NULL DEFAULT '',
    "doList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dontList" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "voicePlayful" INTEGER NOT NULL DEFAULT 50,
    "voiceFormal" INTEGER NOT NULL DEFAULT 50,
    "voiceBold" INTEGER NOT NULL DEFAULT 50,
    "cta" TEXT NOT NULL DEFAULT '',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "audiences" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandEssence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pillar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "angles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pillar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "tone" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL DEFAULT '',
    "html" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "pillarId" TEXT,
    "musingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryTag" (
    "src" TEXT NOT NULL,
    "title" TEXT,
    "loc" TEXT,
    "blurb" TEXT,
    "pillarId" TEXT,
    "messageId" TEXT,
    "inBook" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryTag_pkey" PRIMARY KEY ("src")
);

-- CreateIndex
CREATE INDEX "Pillar_active_sortOrder_idx" ON "Pillar"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "EmailDraft_status_createdAt_idx" ON "EmailDraft"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LibraryTag_pillarId_idx" ON "LibraryTag"("pillarId");


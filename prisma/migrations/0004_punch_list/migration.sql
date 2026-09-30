-- CreateTable
CREATE TABLE "PunchList" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PunchList_pkey" PRIMARY KEY ("id")
);

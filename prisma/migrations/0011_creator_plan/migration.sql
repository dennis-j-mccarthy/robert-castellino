-- Creator → Plan (tool 9): the rhythm settings (singleton) and the weekly
-- plans built from them every Monday at noon Mountain time.
CREATE TABLE "CreatorPlan" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreatorPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL DEFAULT '',
    "emailedTo" TEXT,
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WeeklyPlan_weekStart_key" ON "WeeklyPlan"("weekStart");

-- CreateTable
CREATE TABLE "PlanRun" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "executedCount" INTEGER NOT NULL,
    "skippedUnauthorized" INTEGER NOT NULL,
    "skippedDependencies" INTEGER NOT NULL,
    "totalSteps" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileArtifact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "url" TEXT NOT NULL,
    "contentType" TEXT,
    "contentText" TEXT,
    "stepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileArtifact_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlanRun" ADD CONSTRAINT "PlanRun_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileArtifact" ADD CONSTRAINT "FileArtifact_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

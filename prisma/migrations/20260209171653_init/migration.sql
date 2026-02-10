-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "crossTaskDeps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "entities" JSONB NOT NULL,
    "dates" JSONB NOT NULL,
    "status" JSONB NOT NULL,
    "ambiguities" JSONB NOT NULL,
    "hiddenDependencies" JSONB NOT NULL,
    "taskStatus" TEXT NOT NULL DEFAULT 'interpreted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "totalSteps" INTEGER NOT NULL,
    "estimatedTotalEffort" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "delegationSummary" JSONB NOT NULL,
    "riskFlags" JSONB NOT NULL,
    "nextAction" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "dependencies" JSONB NOT NULL,
    "effort" TEXT NOT NULL,
    "delegation" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_taskId_key" ON "Plan"("taskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;


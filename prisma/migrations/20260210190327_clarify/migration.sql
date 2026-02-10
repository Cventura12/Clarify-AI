/*
  Warnings:

  - A unique constraint covering the columns `[provider,userId]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Integration_provider_key";

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "MemoryEntry" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "appliedAt" TIMESTAMP(3),
    "lastFollowUp" TIMESTAMP(3),
    "emailThreadId" TEXT,
    "portalUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_provider_userId_key" ON "Integration"("provider", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

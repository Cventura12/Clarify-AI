-- AlterTable
ALTER TABLE "ContextEdge" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "ContextNode" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "ContextNode" ADD CONSTRAINT "ContextNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextEdge" ADD CONSTRAINT "ContextEdge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

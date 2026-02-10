import { prisma } from "@/lib/db";

export const addMemoryEntry = async (input: {
  type: string;
  content: string;
  source?: string;
  requestId?: string | null;
  userId?: string | null;
}) => {
  return prisma.memoryEntry.create({
    data: {
      type: input.type,
      content: input.content,
      source: input.source ?? "system",
      requestId: input.requestId ?? undefined,
      userId: input.userId ?? undefined,
    },
  });
};

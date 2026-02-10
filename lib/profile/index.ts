import { prisma } from "@/lib/db";
import type { UserProfile } from "@prisma/client";

export const getProfile = async (userId?: string | null): Promise<UserProfile | null> => {
  if (userId) {
    return prisma.userProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  return prisma.userProfile.findFirst({ orderBy: { createdAt: "desc" } });
};

export const upsertProfile = async (userId: string, data: Partial<UserProfile>) => {
  const existing = await prisma.userProfile.findFirst({ where: { userId } });
  if (existing) {
    return prisma.userProfile.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.userProfile.create({ data: { ...data, userId } });
};

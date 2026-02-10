import { prisma } from "@/lib/db";
import type { UserProfile } from "@prisma/client";

export const getProfile = async (): Promise<UserProfile | null> => {
  return prisma.userProfile.findFirst({ orderBy: { createdAt: "desc" } });
};

export const upsertProfile = async (data: Partial<UserProfile>) => {
  const existing = await prisma.userProfile.findFirst();
  if (existing) {
    return prisma.userProfile.update({
      where: { id: existing.id },
      data,
    });
  }
  return prisma.userProfile.create({ data });
};

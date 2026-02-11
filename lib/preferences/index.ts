import { prisma } from "@/lib/db";
import type { UserPreference } from "@prisma/client";

export const getPreferences = async (userId?: string | null) => {
  if (userId) {
    return prisma.userPreference.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  return [];
};

export const upsertPreference = async (userId: string, key: string, value: string) => {
  const existing = await prisma.userPreference.findFirst({ where: { key, userId } });
  if (existing) {
    return prisma.userPreference.update({
      where: { id: existing.id },
      data: { value },
    });
  }
  return prisma.userPreference.create({
    data: { key, value, userId },
  });
};

export const upsertPreferences = async (userId: string, prefs: Array<{ key: string; value: string }>) => {
  const updates: UserPreference[] = [];
  for (const pref of prefs) {
    updates.push(await upsertPreference(userId, pref.key, pref.value));
  }
  return updates;
};

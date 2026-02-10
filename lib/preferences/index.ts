import { prisma } from "@/lib/db";
import type { UserPreference } from "@prisma/client";

export const getPreferences = async () => {
  return prisma.userPreference.findMany({ orderBy: { createdAt: "desc" } });
};

export const upsertPreference = async (key: string, value: string) => {
  const existing = await prisma.userPreference.findFirst({ where: { key } });
  if (existing) {
    return prisma.userPreference.update({
      where: { id: existing.id },
      data: { value },
    });
  }
  return prisma.userPreference.create({
    data: { key, value },
  });
};

export const upsertPreferences = async (prefs: Array<{ key: string; value: string }>) => {
  const updates: UserPreference[] = [];
  for (const pref of prefs) {
    updates.push(await upsertPreference(pref.key, pref.value));
  }
  return updates;
};

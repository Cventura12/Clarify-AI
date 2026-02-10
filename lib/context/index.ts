import { prisma } from "@/lib/db";
import type { ContextNode, UserPreference, UserProfile } from "@prisma/client";

type CreateNodeInput = {
  label: string;
  type: string;
  metadata?: Record<string, unknown>;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const getOrCreateNode = async ({ label, type, metadata }: CreateNodeInput) => {
  const existing = await prisma.contextNode.findFirst({
    where: {
      label: { equals: label },
      type: { equals: type },
    },
  });

  if (existing) {
    return prisma.contextNode.update({
      where: { id: existing.id },
      data: { metadata: metadata ?? existing.metadata },
    });
  }

  return prisma.contextNode.create({
    data: {
      label,
      type,
      metadata,
    },
  });
};

const linkNodes = async (from: ContextNode, to: ContextNode, relation: string) => {
  const existing = await prisma.contextEdge.findFirst({
    where: {
      fromId: from.id,
      toId: to.id,
      relation,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.contextEdge.create({
    data: {
      fromId: from.id,
      toId: to.id,
      relation,
    },
  });
};

export const syncProfileToContext = async (profile: UserProfile | null) => {
  if (!profile) return null;

  const userLabel = profile.fullName?.trim() || "User";
  const userNode = await getOrCreateNode({ label: userLabel, type: "person" });

  const attach = async (label?: string | null, type?: string, relation?: string, metadata?: Record<string, unknown>) => {
    if (!label || !type || !relation) return;
    const node = await getOrCreateNode({ label, type, metadata });
    await linkNodes(userNode, node, relation);
  };

  await attach(profile.email, "email", "uses");
  await attach(profile.phone, "phone", "uses");
  await attach(profile.school, "school", "attends");

  const locationParts = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
  await attach(locationParts || profile.address, "location", "located_in");

  await attach(profile.linkedIn, "profile", "linked_profile", { network: "linkedin" });

  return userNode;
};

export const syncPreferencesToContext = async (
  userNode: ContextNode | null,
  preferences: UserPreference[]
) => {
  if (!userNode || preferences.length === 0) return;

  for (const pref of preferences) {
    const node = await getOrCreateNode({
      label: pref.key,
      type: "preference",
      metadata: { value: pref.value },
    });
    await linkNodes(userNode, node, "prefers");
  }
};

export const syncRequestHistoryNode = async (summary: string) => {
  if (!summary.trim()) return null;
  return getOrCreateNode({
    label: summary,
    type: "request",
    metadata: { summary },
  });
};

export const normalizePreferenceKey = (key: string) => normalize(key).replace(/\s+/g, "_");

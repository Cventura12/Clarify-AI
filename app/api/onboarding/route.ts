import { z } from "zod";
import { upsertProfile } from "@/lib/profile";
import { upsertPreferences } from "@/lib/preferences";
import { addMemoryEntry } from "@/lib/memory";
import { normalizePreferenceKey, syncPreferencesToContext, syncProfileToContext } from "@/lib/context";

const ProfileSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  school: z.string().optional(),
  graduationYear: z.string().optional(),
  gpa: z.string().optional(),
  linkedIn: z.string().optional(),
});

const PreferencesSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

const OnboardingSchema = z.object({
  profile: ProfileSchema,
  preferences: PreferencesSchema.optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid onboarding payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const profile = await upsertProfile(parsed.data.profile);
    const preferences = parsed.data.preferences ?? [];
    const normalized = preferences
      .filter((pref) => pref.key.trim() && pref.value.trim())
      .map((pref) => ({
        key: normalizePreferenceKey(pref.key),
        value: pref.value.trim(),
      }));

    const savedPrefs = normalized.length ? await upsertPreferences(normalized) : [];
    const userNode = await syncProfileToContext(profile);
    await syncPreferencesToContext(userNode, savedPrefs);

    await addMemoryEntry({
      type: "onboarding",
      content: "Completed onboarding intake.",
      source: "user",
    });

    if (parsed.data.notes?.trim()) {
      await addMemoryEntry({
        type: "preference",
        content: parsed.data.notes.trim(),
        source: "user",
      });
    }

    return Response.json({ profile, preferences: savedPrefs });
  } catch (error) {
    console.error("Onboarding error", error);
    return Response.json({ error: { message: "Failed to save onboarding" } }, { status: 500 });
  }
}

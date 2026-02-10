import { z } from "zod";
import { getPreferences, upsertPreferences } from "@/lib/preferences";
import { normalizePreferenceKey, syncPreferencesToContext, syncProfileToContext } from "@/lib/context";
import { getProfile } from "@/lib/profile";

const PreferencesSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

export async function GET() {
  try {
    const preferences = await getPreferences();
    return Response.json({ preferences });
  } catch (error) {
    console.error("Preferences GET error", error);
    return Response.json({ error: { message: "Failed to load preferences" } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid preferences payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const normalized = parsed.data
      .filter((pref) => pref.key.trim() && pref.value.trim())
      .map((pref) => ({
        key: normalizePreferenceKey(pref.key),
        value: pref.value.trim(),
      }));

    const preferences = await upsertPreferences(normalized);
    const profile = await getProfile();
    const userNode = await syncProfileToContext(profile);
    await syncPreferencesToContext(userNode, preferences);

    return Response.json({ preferences });
  } catch (error) {
    console.error("Preferences PUT error", error);
    return Response.json({ error: { message: "Failed to save preferences" } }, { status: 500 });
  }
}

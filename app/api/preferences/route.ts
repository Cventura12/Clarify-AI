import { z } from "zod";
import { getPreferences, upsertPreferences } from "@/lib/preferences";
import { normalizePreferenceKey, syncPreferencesToContext, syncProfileToContext } from "@/lib/context";
import { getProfile } from "@/lib/profile";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const PreferencesSchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  })
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const preferences = await getPreferences(userId);
    return Response.json({ preferences });
  } catch (error) {
    console.error("Preferences GET error", error);
    return Response.json({ error: { message: "Failed to load preferences" } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

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

    const preferences = await upsertPreferences(userId, normalized);
    const profile = await getProfile(userId);
    const userNode = await syncProfileToContext(userId, profile);
    await syncPreferencesToContext(userId, userNode, preferences);

    return Response.json({ preferences });
  } catch (error) {
    console.error("Preferences PUT error", error);
    return Response.json({ error: { message: "Failed to save preferences" } }, { status: 500 });
  }
}

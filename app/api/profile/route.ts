import { z } from "zod";
import { getProfile, upsertProfile } from "@/lib/profile";
import { syncProfileToContext } from "@/lib/context";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const ProfileSchema = z.object({
  fullName: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  email: z.preprocess(emptyToUndefined, z.string().email().optional().nullable()),
  phone: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  address: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  city: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  state: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  postalCode: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  country: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  school: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  graduationYear: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  gpa: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  linkedIn: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
});

export async function GET() {
  try {
    const profile = await getProfile();
    return Response.json({ profile });
  } catch (error) {
    console.error("Profile GET error", error);
    return Response.json({ error: { message: "Failed to load profile" } }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid profile payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const profile = await upsertProfile(parsed.data);
    await syncProfileToContext(profile);
    return Response.json({ profile });
  } catch (error) {
    console.error("Profile PUT error", error);
    return Response.json({ error: { message: "Failed to save profile" } }, { status: 500 });
  }
}

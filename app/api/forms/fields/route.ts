import { z } from "zod";
import { inferFormFields } from "@/lib/forms/fields";
import { getProfile } from "@/lib/profile";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const FormSchema = z.object({
  context: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = FormSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid form context", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const profile = await getProfile(userId);
    return Response.json({ fields: inferFormFields(parsed.data.context, profile) });
  } catch (error) {
    console.error("Form fields error", error);
    return Response.json({ error: { message: "Failed to infer form fields" } }, { status: 500 });
  }
}

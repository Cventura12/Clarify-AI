import { z } from "zod";
import { generateDraft } from "@/lib/communications/draft";

const DraftSchema = z.object({
  action: z.string(),
  detail: z.string().optional(),
  recipientName: z.string().optional(),
  senderName: z.string().optional(),
  context: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = DraftSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid draft input", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const draft = generateDraft(parsed.data);
    if (!draft) {
      return Response.json({ error: { message: "No email draft available for this action" } }, { status: 400 });
    }

    return Response.json({ draft });
  } catch (error) {
    console.error("Draft API error", error);
    return Response.json({ error: { message: "Failed to create draft" } }, { status: 500 });
  }
}
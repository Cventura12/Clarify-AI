import { z } from "zod";
import { generateDocument } from "@/lib/documents/generate";

const DocumentSchema = z.object({
  templateId: z.string().optional(),
  context: z.string().optional(),
  applicantName: z.string().optional(),
  program: z.string().optional(),
  deadline: z.string().optional(),
  office: z.string().optional(),
  reason: z.string().optional(),
  committee: z.string().optional(),
  recipientName: z.string().optional(),
  story: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = DocumentSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid document input", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const doc = generateDocument(parsed.data);
    if (!doc) {
      return Response.json({ error: { message: "No template available" } }, { status: 400 });
    }

    return Response.json({ document: doc });
  } catch (error) {
    console.error("Document generate error", error);
    return Response.json({ error: { message: "Failed to generate document" } }, { status: 500 });
  }
}
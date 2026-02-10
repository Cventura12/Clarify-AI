import { prisma } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => null);
    const subject = body?.subject?.trim();
    const draftBody = body?.body?.trim();
    const to = body?.to?.trim();

    if (!subject || !draftBody) {
      return Response.json({ error: { message: "Subject and body are required" } }, { status: 400 });
    }

    const log = await prisma.executionLog.findUnique({
      where: { id: params.id },
    });

    if (!log) {
      return Response.json({ error: { message: "Draft not found" } }, { status: 404 });
    }

    const existing = (log.detail as Record<string, unknown> | null) ?? {};
    const draft = (existing.draft as Record<string, unknown> | null) ?? {};

    const updated = await prisma.executionLog.update({
      where: { id: params.id },
      data: {
        detail: {
          ...existing,
          draft: {
            ...draft,
            subject,
            body: draftBody,
            ...(to ? { to } : {}),
            editedAt: new Date().toISOString(),
          },
        },
      },
    });

    await prisma.executionLog.create({
      data: {
        stepId: log.stepId,
        action: "Draft edited",
        status: "edited",
        actor: "user",
        detail: {
          subject,
        },
      },
    });

    return Response.json({ draft: updated });
  } catch (error) {
    console.error("Draft update error", error);
    return Response.json({ error: { message: "Failed to update draft" } }, { status: 500 });
  }
}

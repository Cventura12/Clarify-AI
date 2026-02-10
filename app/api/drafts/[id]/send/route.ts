import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/communications/email";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => null);
    const toFromBody = body?.to?.trim();
    const log = await prisma.executionLog.findUnique({
      where: { id: params.id },
    });

    if (!log) {
      return Response.json({ error: { message: "Draft not found" } }, { status: 404 });
    }

    const existing = (log.detail as Record<string, unknown> | null) ?? {};
    const draft = (existing.draft as Record<string, unknown> | null) ?? {};
    const to = (toFromBody ?? draft.to ?? "").toString().trim();
    const subject = (draft.subject ?? "").toString().trim();
    const text = (draft.body ?? "").toString().trim();

    if (!to) {
      return Response.json({ error: { message: "Recipient email is required to send" } }, { status: 400 });
    }
    if (!subject || !text) {
      return Response.json({ error: { message: "Draft subject and body are required to send" } }, { status: 400 });
    }

    const delivery = await sendEmail({ to, subject, text });

    const updated = await prisma.executionLog.update({
      where: { id: params.id },
      data: {
        detail: {
          ...existing,
          draft: {
            ...draft,
            to,
            delivery: {
              id: delivery?.id ?? null,
              status: delivery?.status ?? "sent",
              provider: "resend",
            },
            sentAt: new Date().toISOString(),
          },
        },
      },
    });

    await prisma.executionLog.create({
      data: {
        stepId: log.stepId,
        action: "Draft sent",
        status: "sent",
        actor: "user",
        detail: {
          subject,
          to,
          delivery: {
            id: delivery?.id ?? null,
            status: delivery?.status ?? "sent",
            provider: "resend",
          },
        },
      },
    });

    return Response.json({ draft: updated });
  } catch (error) {
    console.error("Draft send error", error);
    const message = error instanceof Error ? error.message : "Failed to send draft";
    return Response.json({ error: { message } }, { status: 500 });
  }
}

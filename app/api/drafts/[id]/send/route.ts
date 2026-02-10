import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getGoogleIntegration } from "@/lib/integrations/googleAuth";
import { sendGmailMessage } from "@/lib/integrations/gmail";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const toFromBody = body?.to?.trim();
    const log = await prisma.executionLog.findFirst({
      where: {
        id: params.id,
        step: {
          plan: {
            task: {
              request: {
                userId,
              },
            },
          },
        },
      },
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

    let accessToken = "";
    try {
      const integration = await getGoogleIntegration(userId);
      accessToken = integration.accessToken;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google integration not connected";
      return Response.json({ error: { message } }, { status: 400 });
    }
    const delivery = await sendGmailMessage(accessToken, { to, subject, body: text });

    const updated = await prisma.executionLog.update({
      where: { id: params.id },
      data: {
        detail: {
          ...existing,
          draft: {
            ...draft,
            to,
            delivery: {
              id: (delivery as { id?: string })?.id ?? null,
              threadId: (delivery as { threadId?: string })?.threadId ?? null,
              status: "sent",
              provider: "gmail",
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
            id: (delivery as { id?: string })?.id ?? null,
            threadId: (delivery as { threadId?: string })?.threadId ?? null,
            status: "sent",
            provider: "gmail",
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

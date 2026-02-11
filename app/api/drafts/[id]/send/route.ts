import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getGoogleIntegration } from "@/lib/integrations/googleAuth";
import { sendGmailMessage } from "@/lib/integrations/gmail";
import { pushEventsToGoogle } from "@/lib/integrations/google";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const normalizeFollowUpAt = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return new Date(Date.now() + THREE_DAYS_MS).toISOString();
};

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
    const alreadySent = typeof draft.sentAt === "string" && draft.sentAt.length > 0;

    if (alreadySent) {
      return Response.json({ error: { message: "Draft is already sent" } }, { status: 400 });
    }

    if (!to) {
      return Response.json({ error: { message: "Recipient email is required to send" } }, { status: 400 });
    }
    if (!subject || !text) {
      return Response.json({ error: { message: "Draft subject and body are required to send" } }, { status: 400 });
    }

    let accessToken = "";
    let calendarId = "primary";
    try {
      const integration = await getGoogleIntegration(userId);
      accessToken = integration.accessToken;
      calendarId = integration.calendarId;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google integration not connected";
      return Response.json({ error: { message } }, { status: 400 });
    }

    const delivery = await sendGmailMessage(accessToken, { to, subject, body: text });
    const followUpAt = normalizeFollowUpAt(draft.followUpAt);

    let calendarEvent:
      | { id?: string; status: string; summary: string; error?: string }
      | undefined;
    try {
      const [created] = await pushEventsToGoogle(
        { accessToken, calendarId },
        [
          {
            summary: `Follow up: ${subject}`,
            description: `Check for a response from ${to}.`,
            dueDate: followUpAt.slice(0, 10),
          },
        ]
      );
      if (created) {
        calendarEvent = created;
      }
    } catch (error) {
      calendarEvent = {
        status: "calendar_error",
        summary: `Follow up: ${subject}`,
        error: error instanceof Error ? error.message : "Failed to create calendar follow-up",
      };
    }

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
            followUpAt,
            followUpCalendar: calendarEvent ?? null,
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

    await prisma.executionLog.create({
      data: {
        stepId: log.stepId,
        action: "Follow-up scheduled",
        status: "scheduled",
        actor: "system",
        detail: {
          followUpAt,
          subject,
          to,
          trigger: "auto_after_send",
          calendarEvent: calendarEvent ?? null,
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

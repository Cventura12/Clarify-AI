import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { generateDraft } from "@/lib/communications/draft";
import type { JsonValue } from "@prisma/client/runtime/library";

const DraftRequestSchema = z.object({
  stepId: z.string().min(1),
  recipientName: z.string().optional(),
  senderName: z.string().optional(),
  context: z.string().optional(),
  templateId: z.string().optional(),
  to: z.string().optional(),
});

const isRecord = (value: JsonValue | null): value is Record<string, JsonValue> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = DraftRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid draft request", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const step = await prisma.step.findFirst({
      where: {
        id: parsed.data.stepId,
        plan: {
          task: {
            request: {
              userId,
            },
          },
        },
      },
      include: {
        plan: {
          include: {
            task: {
              include: {
                request: true,
              },
            },
          },
        },
      },
    });

    if (!step) {
      return Response.json({ error: { message: "Step not found" } }, { status: 404 });
    }

    if (step.delegation !== "can_draft") {
      return Response.json({ error: { message: "This step cannot generate a draft" } }, { status: 400 });
    }

    if (step.status !== "authorized") {
      return Response.json({ error: { message: "Step must be authorized first" } }, { status: 400 });
    }

    const recentLogs = await prisma.executionLog.findMany({
      where: { stepId: step.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    for (const log of recentLogs) {
      if (!isRecord(log.detail)) continue;
      const detail = log.detail as Record<string, JsonValue>;
      const draft = detail.draft;
      if (isRecord(draft) && typeof draft.subject === "string" && typeof draft.body === "string") {
        return Response.json({
          draft,
          logId: log.id,
          reused: true,
        });
      }
    }

    const draft = generateDraft({
      action: step.action,
      detail: step.detail,
      recipientName: parsed.data.recipientName,
      senderName: parsed.data.senderName,
      context: parsed.data.context,
      templateId: parsed.data.templateId,
    });

    if (!draft) {
      return Response.json({ error: { message: "No email draft available for this action" } }, { status: 400 });
    }

    const created = await prisma.executionLog.create({
      data: {
        stepId: step.id,
        action: "Draft prepared",
        status: "prepared",
        actor: "system",
        detail: {
          draft: {
            ...draft,
            ...(parsed.data.to ? { to: parsed.data.to } : {}),
          },
        },
      },
    });

    return Response.json({ draft, logId: created.id, reused: false });
  } catch (error) {
    console.error("Draft API error", error);
    return Response.json({ error: { message: "Failed to create draft" } }, { status: 500 });
  }
}

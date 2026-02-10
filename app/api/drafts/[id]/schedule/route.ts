import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const ScheduleSchema = z.object({
  followUpAt: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = ScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid schedule input", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const followUpDate = new Date(parsed.data.followUpAt);
    if (Number.isNaN(followUpDate.getTime())) {
      return Response.json({ error: { message: "Invalid follow-up date" } }, { status: 400 });
    }

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
    const followUpAt = followUpDate.toISOString();

    const updated = await prisma.executionLog.update({
      where: { id: params.id },
      data: {
        detail: {
          ...existing,
          draft: {
            ...draft,
            followUpAt,
          },
        },
      },
    });

    await prisma.executionLog.create({
      data: {
        stepId: log.stepId,
        action: "Follow-up scheduled",
        status: "scheduled",
        actor: "user",
        detail: {
          followUpAt,
          subject: draft.subject ?? "",
        },
      },
    });

    return Response.json({ draft: updated });
  } catch (error) {
    console.error("Draft schedule error", error);
    return Response.json({ error: { message: "Failed to schedule follow-up" } }, { status: 500 });
  }
}

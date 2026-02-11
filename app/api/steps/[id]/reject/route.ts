import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const step = await prisma.step.findUnique({
      where: { id: params.id },
      include: { plan: { include: { task: { include: { request: true } } } } },
    });

    if (!step || step.plan?.task?.request?.userId !== userId) {
      return Response.json({ error: { message: "Step not found" } }, { status: 404 });
    }

    if (step.status === "done") {
      return Response.json(
        { error: { message: "Completed steps cannot be rejected" } },
        { status: 400 }
      );
    }

    const updated = await prisma.step.update({
      where: { id: params.id },
      data: {
        status: "skipped",
      },
    });

    await prisma.executionLog.create({
      data: {
        stepId: updated.id,
        action: "Step rejected",
        status: "skipped",
        actor: "user",
        detail: {
          stepNumber: updated.stepNumber,
          action: updated.action,
          reason: "User rejected step",
        },
      },
    });

    return Response.json({ step: updated });
  } catch (error) {
    console.error("Reject step error", error);
    return Response.json({ error: { message: "Failed to reject step" } }, { status: 500 });
  }
}

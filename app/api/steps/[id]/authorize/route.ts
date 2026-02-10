import { prisma } from "@/lib/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const step = await prisma.step.findUnique({
      where: { id: params.id },
    });

    if (!step) {
      return Response.json({ error: { message: "Step not found" } }, { status: 404 });
    }

    if (step.status === "done") {
      return Response.json({ step });
    }

    const updated = await prisma.step.update({
      where: { id: params.id },
      data: {
        status: "authorized",
        authorizedAt: new Date(),
      },
    });

    await prisma.executionLog.create({
      data: {
        stepId: updated.id,
        action: "Step authorized",
        status: "authorized",
        actor: "user",
        detail: {
          stepNumber: updated.stepNumber,
          action: updated.action,
        },
      },
    });

    return Response.json({ step: updated });
  } catch (error) {
    console.error("Authorize step error", error);
    return Response.json({ error: { message: "Failed to authorize step" } }, { status: 500 });
  }
}
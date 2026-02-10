import { executeAuthorizedStep } from "@/lib/plan/executor";
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

    const result = await executeAuthorizedStep(params.id);
    if (!result.ok) {
      return Response.json({ error: { message: result.message } }, { status: result.status });
    }

    return Response.json({ step: result.step });
  } catch (error) {
    console.error("Execute step error", error);
    return Response.json({ error: { message: "Failed to execute step" } }, { status: 500 });
  }
}

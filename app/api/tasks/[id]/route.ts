import { prisma } from "@/lib/db";
import { TaskInterpretationSchema } from "@/lib/schemas/interpret";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = TaskInterpretationSchema.safeParse(body?.task);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "Task interpretation is invalid", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    if (parsed.data.task_id !== params.id) {
      return Response.json(
        { error: { message: "Task id does not match request" } },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { request: true },
    });
    if (!task || task.request.userId !== userId) {
      return Response.json({ error: { message: "Task not found" } }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        domain: parsed.data.domain,
        urgency: parsed.data.urgency,
        complexity: parsed.data.complexity,
        entities: parsed.data.entities,
        dates: parsed.data.dates,
        status: parsed.data.status,
        ambiguities: parsed.data.ambiguities,
        hiddenDependencies: parsed.data.hidden_dependencies,
      },
    });

    return Response.json({ task: updated });
  } catch (error) {
    console.error("Task PATCH error", error);
    return Response.json({ error: { message: "Failed to update task" } }, { status: 500 });
  }
}

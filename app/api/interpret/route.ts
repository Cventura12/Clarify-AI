import { interpretInput } from "@/lib/ai/interpret";
import { fallbackInterpretation } from "@/lib/ai/fallback";
import { scoreInterpretation } from "@/lib/ai/confidence";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { addMemoryEntry } from "@/lib/memory";
import { syncRequestHistoryNode } from "@/lib/context";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const input = body?.input?.trim();

    if (!input) {
      return Response.json({ error: { message: "Input is required" } }, { status: 400 });
    }

    const result = await interpretInput(input);
    const interpretation = "error" in result ? fallbackInterpretation(input) : result.data;
    const confidence = scoreInterpretation(interpretation);

    const createdRequest = await prisma.request.create({
      data: {
        userId,
        rawInput: interpretation.raw_input,
        requestCount: interpretation.request_count,
        crossTaskDeps: interpretation.cross_task_dependencies,
        tasks: {
          create: interpretation.tasks.map((task) => ({
            id: task.task_id,
            title: task.title,
            summary: task.summary,
            domain: task.domain,
            urgency: task.urgency,
            complexity: task.complexity,
            entities: task.entities,
            dates: task.dates,
            status: task.status,
            ambiguities: task.ambiguities,
            hiddenDependencies: task.hidden_dependencies,
            taskStatus: "interpreted",
            confidenceScore: confidence.taskScores.get(task.task_id) ?? 0.5,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    await addMemoryEntry({
      type: "request",
      content: interpretation.raw_input,
      source: "user",
      requestId: createdRequest.id,
      userId,
    });

    await syncRequestHistoryNode(interpretation.raw_input);

    return Response.json({
      requestId: createdRequest.id,
      interpretation,
      confidence: confidence.overall,
      fallback: "error" in result,
      error: "error" in result ? result.error : undefined,
    });
  } catch (error) {
    console.error("Interpret route error", error);
    return Response.json({ error: { message: "Failed to interpret request" } }, { status: 500 });
  }
}

import { Prisma } from "@prisma/client";
import { interpretInput } from "@/lib/ai/interpret";
import { fallbackInterpretation } from "@/lib/ai/fallback";
import { scoreInterpretation } from "@/lib/ai/confidence";
import { prisma } from "@/lib/db";
import { addMemoryEntry } from "@/lib/memory";
import { syncRequestHistoryNode } from "@/lib/context";

const toJson = (value: unknown) => value as Prisma.InputJsonValue;

type CreateInterpretedRequestInput = {
  userId: string;
  input: string;
};

export async function createInterpretedRequest({ userId, input }: CreateInterpretedRequestInput) {
  const aiResult = await interpretInput(input);
  const interpretation = "error" in aiResult ? fallbackInterpretation(input) : aiResult.data;
  const confidence = scoreInterpretation(interpretation);

  const createdRequest = await prisma.request.create({
    data: {
      userId,
      rawInput: input,
      requestCount: interpretation.request_count,
      crossTaskDeps: toJson(interpretation.cross_task_dependencies),
      tasks: {
        create: interpretation.tasks.map((task) => ({
          id: task.task_id,
          title: task.title,
          summary: task.summary,
          domain: task.domain,
          urgency: task.urgency,
          complexity: task.complexity,
          entities: toJson(task.entities),
          dates: toJson(task.dates),
          status: toJson(task.status),
          ambiguities: toJson(task.ambiguities),
          hiddenDependencies: toJson(task.hidden_dependencies),
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

  await syncRequestHistoryNode(userId, interpretation.raw_input);

  return {
    requestId: createdRequest.id,
    interpretation,
    confidence: confidence.overall,
    fallback: "error" in aiResult,
    aiError: "error" in aiResult ? aiResult.error : undefined,
  };
}


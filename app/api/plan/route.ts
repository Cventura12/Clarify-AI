import { buildPlan } from "@/lib/ai/plan";
import { fallbackPlan } from "@/lib/ai/fallback";
import { scorePlan } from "@/lib/ai/confidence";
import { TaskInterpretationSchema } from "@/lib/schemas/interpret";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    let task = body?.task;

    if (!task && body?.taskId) {
      const storedTask = await prisma.task.findUnique({
        where: { id: body.taskId },
        include: { request: true },
      });

      if (!storedTask || storedTask.request.userId !== userId) {
        return Response.json({ error: { message: "Task not found" } }, { status: 404 });
      }

      task = {
        task_id: storedTask.id,
        title: storedTask.title,
        summary: storedTask.summary,
        domain: storedTask.domain,
        urgency: storedTask.urgency,
        complexity: storedTask.complexity,
        entities: storedTask.entities,
        dates: storedTask.dates,
        status: storedTask.status,
        ambiguities: storedTask.ambiguities,
        hidden_dependencies: storedTask.hiddenDependencies,
      };
    }

    const parsedTask = TaskInterpretationSchema.safeParse(task);
    if (!parsedTask.success) {
      return Response.json(
        { error: { message: "Task interpretation is invalid", issues: parsedTask.error.flatten() } },
        { status: 400 }
      );
    }

    const planResult = await buildPlan(parsedTask.data);
    const planData = "error" in planResult ? fallbackPlan(parsedTask.data) : planResult.data;
    const planConfidence = "error" in planResult ? 0.35 : scorePlan(planData);
    if (planData.task_id !== parsedTask.data.task_id) {
      return Response.json(
        { error: { message: "Plan task_id does not match the requested task" } },
        { status: 400 }
      );
    }

    const existingPlan = await prisma.plan.findUnique({
      where: { taskId: planData.task_id },
    });

    if (existingPlan) {
      await prisma.step.deleteMany({ where: { planId: existingPlan.id } });
    }

    const planRecord = await prisma.plan.upsert({
      where: { taskId: planData.task_id },
      update: {
        totalSteps: planData.total_steps,
        estimatedTotalEffort: planData.estimated_total_effort,
        deadline: parseDate(planData.deadline),
        delegationSummary: planData.delegation_summary,
        riskFlags: planData.risk_flags,
        nextAction: planData.next_action,
        confidenceScore: planConfidence,
        steps: {
          create: planData.steps.map((step) => ({
            stepNumber: step.step_number,
            action: step.action,
            detail: step.detail,
            dependencies: step.dependencies,
            effort: step.effort,
            delegation: step.delegation,
            suggestedDate: parseDate(step.suggested_date),
            status: step.status,
          })),
        },
      },
      create: {
        id: planData.plan_id,
        taskId: planData.task_id,
        totalSteps: planData.total_steps,
        estimatedTotalEffort: planData.estimated_total_effort,
        deadline: parseDate(planData.deadline),
        delegationSummary: planData.delegation_summary,
        riskFlags: planData.risk_flags,
        nextAction: planData.next_action,
        confidenceScore: planConfidence,
        steps: {
          create: planData.steps.map((step) => ({
            stepNumber: step.step_number,
            action: step.action,
            detail: step.detail,
            dependencies: step.dependencies,
            effort: step.effort,
            delegation: step.delegation,
            suggestedDate: parseDate(step.suggested_date),
            status: step.status,
          })),
        },
      },
      include: { steps: true },
    });

    await prisma.task.update({
      where: { id: planData.task_id },
      data: { taskStatus: "planned" },
    });

    return Response.json({
      plan: planRecord,
      confidence: planConfidence,
      fallback: "error" in planResult,
      error: "error" in planResult ? planResult.error : undefined,
    });
  } catch (error) {
    console.error("Plan route error", error);
    return Response.json({ error: { message: "Failed to build plan" } }, { status: 500 });
  }
}

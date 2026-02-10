import { prisma } from "@/lib/db";
import type { JsonValue } from "@prisma/client/runtime/library";
import { executeAuthorizedStep } from "@/lib/plan/executor";

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
      include: {
        steps: { orderBy: { stepNumber: "asc" } },
      },
    });

    if (!plan) {
      return Response.json({ error: { message: "Plan not found" } }, { status: 404 });
    }

    const stepsByNumber = new Map(plan.steps.map((step) => [step.stepNumber, step]));
    let executed = 0;
    let skippedUnauthorized = 0;
    let skippedDependencies = 0;

    for (const step of plan.steps) {
      if (step.status === "done" || step.status === "skipped") {
        continue;
      }

      const dependencies = asArray<{ type: string; step_ref?: number | null }>(step.dependencies);
      const blockedByDependency = dependencies.some((dependency) => {
        if (dependency.type !== "step" || !dependency.step_ref) return false;
        const target = stepsByNumber.get(dependency.step_ref);
        return Boolean(target && target.status !== "done");
      });

      if (blockedByDependency) {
        skippedDependencies += 1;
        continue;
      }

      if (step.status !== "authorized") {
        skippedUnauthorized += 1;
        continue;
      }

      const result = await executeAuthorizedStep(step.id);
      if (!result.ok) {
        return Response.json(
          { executed, stoppedAt: step.id, reason: result.message },
          { status: result.status }
        );
      }

      executed += 1;
      stepsByNumber.set(step.stepNumber, result.step);
    }

    await prisma.planRun.create({
      data: {
        planId: plan.id,
        executedCount: executed,
        skippedUnauthorized,
        skippedDependencies,
        totalSteps: plan.steps.length,
      },
    });

    return Response.json({ executed, skippedUnauthorized, skippedDependencies, completed: true });
  } catch (error) {
    console.error("Plan execute error", error);
    return Response.json({ error: { message: "Failed to execute plan" } }, { status: 500 });
  }
}

import type { InterpretResponse, TaskInterpretation } from "@/lib/schemas/interpret";
import type { PlanResponse } from "@/lib/schemas/plan";

const clamp = (value: number, min = 0.1, max = 0.99) =>
  Math.min(max, Math.max(min, value));

export const scoreTaskInterpretation = (task: TaskInterpretation) => {
  let score = 0.85;

  const ambiguityCount = task.ambiguities?.length ?? 0;
  score -= Math.min(ambiguityCount * 0.08, 0.4);

  if ((task.entities?.length ?? 0) === 0) {
    score -= 0.08;
  }

  const hasDate = (task.dates ?? []).some((item) => item.date);
  if (!hasDate && (task.urgency === "high" || task.urgency === "critical")) {
    score -= 0.1;
  }

  if ((task.hidden_dependencies?.length ?? 0) === 0 && task.complexity === "complex") {
    score -= 0.08;
  }

  const pending = task.status?.what_is_pending ?? "";
  if (pending.trim().length < 4) {
    score -= 0.05;
  }

  return clamp(score);
};

export const scoreInterpretation = (interpretation: InterpretResponse) => {
  const taskScores = new Map<string, number>();
  interpretation.tasks.forEach((task) => {
    taskScores.set(task.task_id, scoreTaskInterpretation(task));
  });
  const scores = Array.from(taskScores.values());
  const overall = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5;
  return { overall: clamp(overall), taskScores };
};

export const scorePlan = (plan: PlanResponse) => {
  let score = 0.82;
  const steps = plan.steps ?? [];

  if (plan.total_steps !== steps.length) {
    score -= 0.12;
  }

  if (steps.length === 0) {
    score -= 0.3;
  }

  if ((plan.risk_flags ?? []).length === 0) {
    score -= 0.05;
  }

  if (!plan.next_action?.action) {
    score -= 0.05;
  }

  const userOnlyCount = steps.filter((step) => step.delegation === "user_only").length;
  if (steps.length > 0 && userOnlyCount / steps.length > 0.7) {
    score -= 0.05;
  }

  return clamp(score);
};

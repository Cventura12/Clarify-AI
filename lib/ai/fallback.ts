import type { InterpretResponse, TaskInterpretation } from "@/lib/schemas/interpret";
import type { PlanResponse } from "@/lib/schemas/plan";

const newId = () => crypto.randomUUID();

export const fallbackInterpretation = (input: string): InterpretResponse => {
  const taskId = newId();
  const task: TaskInterpretation = {
    task_id: taskId,
    title: "Clarify request details",
    summary: "We need more detail to interpret this request reliably.",
    domain: "other",
    urgency: "low",
    complexity: "simple",
    entities: [],
    dates: [],
    status: {
      what_is_done: "No confirmed actions yet.",
      what_is_pending: "Clarify the goal, deadline, and required actions.",
      blockers: [],
    },
    ambiguities: [
      {
        question: "What exactly do you want Clarify to handle?",
        why_it_matters: "Clarify needs a concrete goal before planning.",
        default_assumption: null,
      },
    ],
    hidden_dependencies: [],
  };

  return {
    raw_input: input,
    request_count: 1,
    tasks: [task],
    cross_task_dependencies: [],
  };
};

export const fallbackPlan = (task: TaskInterpretation): PlanResponse => {
  const planId = newId();
  return {
    task_id: task.task_id,
    title: task.title,
    plan_id: planId,
    total_steps: 2,
    estimated_total_effort: "short",
    deadline: null,
    steps: [
      {
        step_number: 1,
        action: "Clarify missing details",
        detail: "Collect the deadline, target system, and desired outcome.",
        dependencies: [],
        effort: "short",
        delegation: "user_only",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 2,
        action: "Confirm next actions",
        detail: "Once details are clear, outline the specific steps.",
        dependencies: [{ type: "information", description: "Clarified details", step_ref: null }],
        effort: "short",
        delegation: "user_only",
        suggested_date: null,
        status: "pending",
      },
    ],
    risk_flags: [
      {
        risk: "Insufficient detail to generate a reliable plan.",
        severity: "low",
        mitigation: "Collect missing details before planning.",
      },
    ],
    next_action: {
      step_number: 1,
      action: "Clarify missing details",
      why_first: "Planning requires a precise goal and deadline.",
    },
    delegation_summary: {
      can_draft: 0,
      can_remind: 0,
      can_track: 0,
      user_only: 2,
    },
  };
};

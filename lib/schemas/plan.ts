import { z } from "zod";

export const StepDependencySchema = z.object({
  type: z.enum(["step", "credential", "document", "external_party", "information"]),
  description: z.string(),
  step_ref: z.number().nullable(),
});

export const StepSchema = z.object({
  step_number: z.number(),
  action: z.string(),
  detail: z.string(),
  dependencies: z.array(StepDependencySchema),
  effort: z.enum(["quick", "short", "medium", "long"]),
  delegation: z.enum(["can_draft", "can_remind", "can_track", "user_only"]),
  suggested_date: z.string().nullable(),
  status: z.enum(["pending", "ready", "blocked", "done"]),
});

export const RiskFlagSchema = z.object({
  risk: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  mitigation: z.string(),
});

export const PlanResponseSchema = z.object({
  task_id: z.string(),
  title: z.string(),
  plan_id: z.string(),
  total_steps: z.number(),
  estimated_total_effort: z.string(),
  deadline: z.string().nullable(),
  steps: z.array(StepSchema),
  risk_flags: z.array(RiskFlagSchema),
  next_action: z.object({
    step_number: z.number(),
    action: z.string(),
    why_first: z.string(),
  }),
  delegation_summary: z.object({
    can_draft: z.number(),
    can_remind: z.number(),
    can_track: z.number(),
    user_only: z.number(),
  }),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;

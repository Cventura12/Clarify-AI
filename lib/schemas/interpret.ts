import { z } from "zod";

export const EntitySchema = z.object({
  name: z.string(),
  type: z.enum(["organization", "person", "portal", "platform", "document"]),
});

export const DateSchema = z.object({
  description: z.string(),
  date: z.string().nullable(),
  source: z.enum(["stated", "inferred", "unknown"]),
});

export const AmbiguitySchema = z.object({
  question: z.string(),
  why_it_matters: z.string(),
  default_assumption: z.string().nullable(),
});

export const HiddenDependencySchema = z.object({
  insight: z.string(),
  risk_if_ignored: z.string(),
});

export const TaskInterpretationSchema = z.object({
  task_id: z.string(),
  title: z.string(),
  summary: z.string(),
  domain: z.enum([
    "follow_up",
    "portal",
    "job_application",
    "scholarship",
    "academic",
    "financial",
    "medical",
    "legal",
    "housing",
    "other",
  ]),
  urgency: z.enum(["critical", "high", "medium", "low"]),
  complexity: z.enum(["simple", "moderate", "complex"]),
  entities: z.array(EntitySchema),
  dates: z.array(DateSchema),
  status: z.object({
    what_is_done: z.string(),
    what_is_pending: z.string(),
    blockers: z.array(z.string()),
  }),
  ambiguities: z.array(AmbiguitySchema),
  hidden_dependencies: z.array(HiddenDependencySchema),
});

export const InterpretResponseSchema = z.object({
  raw_input: z.string(),
  request_count: z.number(),
  tasks: z.array(TaskInterpretationSchema),
  cross_task_dependencies: z.array(
    z.object({
      from_task: z.string(),
      to_task: z.string(),
      relationship: z.enum(["blocks", "informs", "shares_deadline"]),
    })
  ),
});

export type TaskInterpretation = z.infer<typeof TaskInterpretationSchema>;
export type InterpretResponse = z.infer<typeof InterpretResponseSchema>;

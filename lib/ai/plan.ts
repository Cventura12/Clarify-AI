import { getOpenAIClient } from "@/lib/ai/client";
import { PlanResponseSchema, type PlanResponse } from "@/lib/schemas/plan";
import { TaskInterpretationSchema, type TaskInterpretation } from "@/lib/schemas/interpret";

const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 2200;
const TIMEOUT_MS = 20000;

export type AIError = {
  message: string;
  type: "timeout" | "validation" | "parse_error" | "api_error";
  raw?: string;
  issues?: unknown;
};

const SYSTEM_PROMPT = `You are Clarify's planning engine. Return only JSON matching the schema.

Requirements:
1) Concrete, scoped, ordered steps.
2) Dependencies for steps.
3) Effort estimate per step.
4) Delegation per step.
5) Specific risk flags.
6) Suggested timeline.

Return JSON only.`;

const REVIEW_PROMPT = `You are Clarify's plan reviewer. Fix any missing or vague items.

Checklist:
- Steps concrete, scoped, ordered.
- Dependencies explicit.
- Risk flags specific.
- Next action valid.

Return corrected plan as JSON only.`;

const parseJsonFromText = (text: string) => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("No JSON object found in response");
    }
    const slice = trimmed.slice(start, end + 1);
    return JSON.parse(slice) as unknown;
  }
};

const shouldReview = (task: TaskInterpretation, plan: PlanResponse) =>
  task.complexity === "complex" || plan.total_steps >= 6;

const reviewPlan = async (task: TaskInterpretation, plan: PlanResponse, controller: AbortController) => {
  const client = getOpenAIClient();
  const response = await client.responses.create(
    {
      model: MODEL,
      input: [
        { role: "system", content: REVIEW_PROMPT },
        { role: "user", content: JSON.stringify({ task, plan }) },
      ],
      text: { format: { type: "json_object" } },
      temperature: 0.1,
      max_output_tokens: MAX_TOKENS,
    },
    { signal: controller.signal }
  );

  const rawText = response.output_text ?? "";
  if (!rawText) {
    throw new Error("Empty review response");
  }
  const parsedJson = parseJsonFromText(rawText);
  const parsed = PlanResponseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("Review response failed validation");
  }
  return parsed.data;
};

export async function buildPlan(
  task: TaskInterpretation
): Promise<{ data: PlanResponse } | { error: AIError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const validatedTask = TaskInterpretationSchema.parse(task);
    const client = getOpenAIClient();
    const response = await client.responses.create(
      {
        model: MODEL,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(validatedTask) },
        ],
        text: { format: { type: "json_object" } },
        temperature: 0.2,
        max_output_tokens: MAX_TOKENS,
      },
      { signal: controller.signal }
    );

    const rawText = response.output_text ?? "";
    if (!rawText) {
      return {
        error: {
          message: "Empty response from AI",
          type: "parse_error",
        },
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = parseJsonFromText(rawText);
    } catch (error) {
      console.error("Plan JSON parse error", { rawText, error });
      return {
        error: {
          message: "Failed to parse JSON from AI response",
          type: "parse_error",
          raw: rawText,
        },
      };
    }

    const parsed = PlanResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.error("Plan validation error", parsed.error.flatten(), rawText);
      return {
        error: {
          message: "AI response failed validation",
          type: "validation",
          raw: rawText,
          issues: parsed.error.flatten(),
        },
      };
    }

    let planData = parsed.data;

    if (shouldReview(validatedTask, planData)) {
      try {
        planData = await reviewPlan(validatedTask, planData, controller);
      } catch (error) {
        console.error("Plan review failed, using original plan", error);
      }
    }

    return { data: planData };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { error: { message: "AI request timed out", type: "timeout" } };
    }

    console.error("Plan API error", error);
    return { error: { message: "AI request failed", type: "api_error" } };
  } finally {
    clearTimeout(timeout);
  }
}

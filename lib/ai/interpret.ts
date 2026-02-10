import { getOpenAIClient } from "@/lib/ai/client";
import {
  InterpretResponseSchema,
  type InterpretResponse,
} from "@/lib/schemas/interpret";

const MODEL = "gpt-4o-mini";
const MAX_TOKENS = 1400;
const TIMEOUT_MS = 20000;

export type AIError = {
  message: string;
  type: "timeout" | "validation" | "parse_error" | "api_error";
  raw?: string;
  issues?: unknown;
};

const SYSTEM_PROMPT = `You are Clarify's interpretation engine. Return only JSON matching the schema.

Steps:
1) Decompose into distinct tasks.
2) Classify domain, urgency, complexity (use provided enums).
3) Extract entities, dates, amounts, statuses.
4) Flag ambiguities with why they matter. Do not assume.
5) Surface hidden dependencies.

Return JSON only, no extra text.`;

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

export async function interpretInput(
  input: string
): Promise<{ data: InterpretResponse } | { error: AIError }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const client = getOpenAIClient();
    const response = await client.responses.create(
      {
        model: MODEL,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: input },
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
      console.error("Interpret JSON parse error", { rawText, error });
      return {
        error: {
          message: "Failed to parse JSON from AI response",
          type: "parse_error",
          raw: rawText,
        },
      };
    }

    const parsed = InterpretResponseSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.error("Interpret validation error", parsed.error.flatten(), rawText);
      return {
        error: {
          message: "AI response failed validation",
          type: "validation",
          raw: rawText,
          issues: parsed.error.flatten(),
        },
      };
    }

    return { data: parsed.data };
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return { error: { message: "AI request timed out", type: "timeout" } };
    }

    console.error("Interpret API error", error);
    return { error: { message: "AI request failed", type: "api_error" } };
  } finally {
    clearTimeout(timeout);
  }
}

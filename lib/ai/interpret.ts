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

const SYSTEM_PROMPT = `You are the interpretation engine for Clarify, a personal execution layer.

Your job is to take a raw, messy human request and return a structured interpretation. You do NOT plan. You do NOT act. You only interpret.

When you receive a request, do the following:

1) DECOMPOSE: Separate distinct tasks. Each task gets its own interpretation object.
2) CLASSIFY:
 - domain: follow_up | portal | job_application | scholarship | academic | financial | medical | legal | housing | other
 - urgency: critical | high | medium | low
 - complexity: simple | moderate | complex
3) EXTRACT: entities, dates, statuses.
4) FLAG AMBIGUITIES: identify missing info and why it matters. Do not guess.
5) SURFACE HIDDEN DEPENDENCIES: include likely blockers user did not mention.

Rules:
- Return JSON only. No markdown.
- Each task must have a specific, real title (never generic placeholders).
- Preserve raw_input exactly.
- Use null for unknown dates.
- If no cross-task links, return an empty array.`;

const DOMAIN_VALUES = new Set([
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
]);

const URGENCY_VALUES = new Set(["critical", "high", "medium", "low"]);
const COMPLEXITY_VALUES = new Set(["simple", "moderate", "complex"]);
const ENTITY_VALUES = new Set(["organization", "person", "portal", "platform", "document"]);
const DATE_SOURCE_VALUES = new Set(["stated", "inferred", "unknown"]);
const RELATION_VALUES = new Set(["blocks", "informs", "shares_deadline"]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const normalizeEnum = <T extends string>(value: unknown, allowed: Set<T>, fallback: T): T => {
  const candidate = typeof value === "string" ? (value.trim().toLowerCase() as T) : fallback;
  return allowed.has(candidate) ? candidate : fallback;
};

const normalizeDates = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    const rawDate = record.date;
    return {
      description: asString(record.description, "Potential deadline"),
      date: typeof rawDate === "string" ? rawDate : null,
      source: normalizeEnum(record.source, DATE_SOURCE_VALUES, "unknown"),
    };
  });
};

const normalizeStatus = (value: unknown) => {
  const record = asRecord(value);
  return {
    what_is_done: asString(record.what_is_done, "No confirmed actions yet."),
    what_is_pending: asString(record.what_is_pending, "Clarify remaining actions."),
    blockers: Array.isArray(record.blockers)
      ? record.blockers.filter((item): item is string => typeof item === "string")
      : [],
  };
};

const normalizeTasks = (value: unknown, input: string) => {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item);
    const hiddenDependencies = record.hidden_dependencies ?? record.hiddenDependencies;

    return {
      task_id:
        asString(record.task_id) ||
        asString(record.taskId) ||
        asString(record.id) ||
        `task_${index + 1}_${crypto.randomUUID()}`,
      title:
        asString(record.title).trim() ||
        asString(record.summary).trim() ||
        asString(record.action).trim() ||
        `Task ${index + 1}: ${input.slice(0, 60).trim()}`,
      summary:
        asString(record.summary).trim() ||
        asString(record.title).trim() ||
        input,
      domain: normalizeEnum(record.domain, DOMAIN_VALUES, "other"),
      urgency: normalizeEnum(record.urgency, URGENCY_VALUES, "medium"),
      complexity: normalizeEnum(record.complexity, COMPLEXITY_VALUES, "moderate"),
      entities: Array.isArray(record.entities)
        ? record.entities.map((entity) => {
            const entityRecord = asRecord(entity);
            return {
              name: asString(entityRecord.name, "Unknown"),
              type: normalizeEnum(entityRecord.type, ENTITY_VALUES, "organization"),
            };
          })
        : [],
      dates: normalizeDates(record.dates),
      status: normalizeStatus(record.status),
      ambiguities: Array.isArray(record.ambiguities)
        ? record.ambiguities.map((ambiguity) => {
            const ambiguityRecord = asRecord(ambiguity);
            return {
              question: asString(ambiguityRecord.question, "What detail is still missing?"),
              why_it_matters: asString(
                ambiguityRecord.why_it_matters,
                "Missing details can block execution."
              ),
              default_assumption:
                typeof ambiguityRecord.default_assumption === "string"
                  ? ambiguityRecord.default_assumption
                  : null,
            };
          })
        : [],
      hidden_dependencies: Array.isArray(hiddenDependencies)
        ? hiddenDependencies.map((dependency) => {
            const dependencyRecord = asRecord(dependency);
            return {
              insight: asString(dependencyRecord.insight, "Potential dependency not confirmed."),
              risk_if_ignored: asString(
                dependencyRecord.risk_if_ignored,
                "Could delay completion."
              ),
            };
          })
        : [],
    };
  });
};

const normalizeInterpretation = (value: unknown, input: string): unknown => {
  const record = asRecord(value);
  const tasks = normalizeTasks(record.tasks, input);

  return {
    raw_input: asString(record.raw_input, input),
    request_count:
      typeof record.request_count === "number"
        ? record.request_count
        : tasks.length > 0
          ? tasks.length
          : 1,
    tasks,
    cross_task_dependencies: Array.isArray(record.cross_task_dependencies)
      ? record.cross_task_dependencies.map((dependency) => {
          const dependencyRecord = asRecord(dependency);
          return {
            from_task: asString(dependencyRecord.from_task),
            to_task: asString(dependencyRecord.to_task),
            relationship: normalizeEnum(
              dependencyRecord.relationship,
              RELATION_VALUES,
              "informs"
            ),
          };
        })
      : [],
  };
};

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

    const normalized = normalizeInterpretation(parsedJson, input);
    const parsed = InterpretResponseSchema.safeParse(normalized);
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

    const hasRealTask = parsed.data.tasks.some(
      (task) =>
        task.title.trim().length > 8 &&
        !task.title.toLowerCase().includes("clarify request details")
    );

    if (!hasRealTask) {
      return {
        error: {
          message: "AI response was too generic",
          type: "validation",
          raw: rawText,
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

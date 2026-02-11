import type { InterpretResponse, TaskInterpretation } from "@/lib/schemas/interpret";
import type { PlanResponse } from "@/lib/schemas/plan";

const newId = () => crypto.randomUUID();

const monthPattern =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}\b/i;

const weekdayPattern =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/i;

const inDaysPattern = /\bin\s+(\d{1,2})\s+days?\b/i;

const normalizeTitle = (segment: string) => {
  const cleaned = segment
    .replace(
      /^(i\s+need\s+to|i\s+have\s+to|need\s+to|please|can\s+you|help\s+me|i\s+should)\s+/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!,;:]+$/, "");

  if (!cleaned) return "Untitled task";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const detectDate = (segment: string): { description: string; date: string | null; source: "stated" | "inferred" | "unknown" }[] => {
  const lower = segment.toLowerCase();
  const dates: { description: string; date: string | null; source: "stated" | "inferred" | "unknown" }[] = [];

  const inDaysMatch = segment.match(inDaysPattern);
  if (inDaysMatch) {
    const days = Number(inDaysMatch[1]);
    if (!Number.isNaN(days)) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      dates.push({
        description: `Due in ${days} day${days === 1 ? "" : "s"}`,
        date: target.toISOString(),
        source: "inferred",
      });
    }
  }

  const weekdayMatch = segment.match(weekdayPattern);
  if (weekdayMatch) {
    const token = weekdayMatch[1].toLowerCase();
    if (token === "today") {
      dates.push({ description: "Due today", date: new Date().toISOString(), source: "inferred" });
    } else if (token === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dates.push({ description: "Due tomorrow", date: tomorrow.toISOString(), source: "inferred" });
    } else {
      dates.push({
        description: `Mentions ${weekdayMatch[1]}`,
        date: null,
        source: "stated",
      });
    }
  }

  const monthMatch = segment.match(monthPattern);
  if (monthMatch) {
    const parsed = new Date(monthMatch[0]);
    dates.push({
      description: `Mentions ${monthMatch[0]}`,
      date: Number.isNaN(parsed.getTime()) ? null : parsed.toISOString(),
      source: "stated",
    });
  }

  if (dates.length === 0 && lower.includes("deadline")) {
    dates.push({ description: "Deadline mentioned but date missing", date: null, source: "unknown" });
  }

  return dates;
};

const classifyDomain = (segment: string): TaskInterpretation["domain"] => {
  const text = segment.toLowerCase();
  if (text.includes("follow up") || text.includes("follow-up") || text.includes("email")) return "follow_up";
  if (text.includes("portal")) return "portal";
  if (text.includes("job") || text.includes("application")) return "job_application";
  if (text.includes("scholarship")) return "scholarship";
  if (text.includes("assignment") || text.includes("exam") || text.includes("class") || text.includes("professor")) return "academic";
  if (text.includes("financial aid") || text.includes("fafsa") || text.includes("tuition") || text.includes("loan")) return "financial";
  if (text.includes("doctor") || text.includes("medical") || text.includes("appointment")) return "medical";
  if (text.includes("lease") || text.includes("rent") || text.includes("housing")) return "housing";
  if (text.includes("court") || text.includes("legal")) return "legal";
  return "other";
};

const deriveUrgency = (dates: TaskInterpretation["dates"]): TaskInterpretation["urgency"] => {
  const validDates = dates
    .map((item) => (item.date ? new Date(item.date) : null))
    .filter((item): item is Date => item instanceof Date && !Number.isNaN(item.getTime()));

  if (validDates.length === 0) return "medium";

  const soonest = validDates.sort((a, b) => a.getTime() - b.getTime())[0];
  const diffDays = Math.ceil((soonest.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) return "critical";
  if (diffDays <= 7) return "high";
  if (diffDays <= 30) return "medium";
  return "low";
};

const deriveComplexity = (segment: string): TaskInterpretation["complexity"] => {
  const normalized = segment.toLowerCase();
  const signals = [" and ", " then ", " after ", "before ", "portal", "application", "documents"];
  const score = signals.reduce((count, signal) => count + (normalized.includes(signal) ? 1 : 0), 0);
  if (score >= 4) return "complex";
  if (score >= 2) return "moderate";
  return "simple";
};

const splitIntoTaskSegments = (input: string) => {
  const normalized = input.replace(/\s+/g, " ").trim();
  const parts = normalized
    .split(/\s(?:also|plus)\s|;\s|\. (?=[A-Z])/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 6);

  return parts.length > 0 ? parts : [normalized];
};

export const fallbackInterpretation = (input: string): InterpretResponse => {
  const segments = splitIntoTaskSegments(input).slice(0, 5);

  const tasks: TaskInterpretation[] = segments.map((segment, index) => {
    const dates = detectDate(segment);
    const domain = classifyDomain(segment);
    const urgency = deriveUrgency(dates);
    const complexity = deriveComplexity(segment);

    return {
      task_id: newId(),
      title: normalizeTitle(segment),
      summary: segment,
      domain,
      urgency,
      complexity,
      entities: [],
      dates,
      status: {
        what_is_done: segment.toLowerCase().includes("submitted")
          ? "User indicates part of this is already submitted."
          : "No confirmed completion yet.",
        what_is_pending: "Execute the concrete next step and confirm completion.",
        blockers: [],
      },
      ambiguities: dates.some((item) => item.date)
        ? []
        : [
            {
              question: "What is the exact deadline for this task?",
              why_it_matters: "Urgency and sequencing depend on the real due date.",
              default_assumption: null,
            },
          ],
      hidden_dependencies: [
        {
          insight:
            domain === "follow_up"
              ? "Follow-up quality improves when prior message date and recipient are confirmed."
              : "This task may require documents or credentials not yet provided.",
          risk_if_ignored: "Execution can stall mid-flow due to missing prerequisites.",
        },
      ],
    };
  });

  return {
    raw_input: input,
    request_count: tasks.length,
    tasks,
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

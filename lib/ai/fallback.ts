import type { InterpretResponse, TaskInterpretation } from "@/lib/schemas/interpret";
import type { PlanResponse } from "@/lib/schemas/plan";

const newId = () => crypto.randomUUID();

const monthPattern =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}\b/i;

const weekdayPattern =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)\b/i;

const inDaysPattern = /\bin\s+(\d{1,2})\s+days?\b/i;
const explicitSplitPattern = /\s(?:also|plus|additionally)\s|;\s|\. (?=[A-Z])|\s-\s|\s—\s/i;

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
  const coarseParts = normalized
    .split(explicitSplitPattern)
    .map((part) => part.trim())
    .filter((part) => part.length > 6);

  const parts = (coarseParts.length > 0 ? coarseParts : [normalized]).flatMap((part) => {
    const lowered = part.toLowerCase();
    const hasManyActions =
      /(need to|check|verify|follow up|compare|submit|email|log in|review|confirm)/g.test(lowered) &&
      lowered.includes(" and ") &&
      part.length > 90;

    if (!hasManyActions) return [part];

    return part
      .split(/\s+and\s+(?=(?:i\s+)?(?:need to|have to|must|check|verify|follow|compare|email|submit|review|confirm))/i)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 8);
  });

  return parts.length > 0 ? parts : [normalized];
};

const extractDeadline = (task: TaskInterpretation) => {
  const firstDate = task.dates.find((item) => item.date)?.date ?? null;
  if (!firstDate) return null;
  const parsed = new Date(firstDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const nextDayIso = (daysFromNow: number) => {
  const next = new Date();
  next.setDate(next.getDate() + daysFromNow);
  return next.toISOString();
};

const buildPlanSteps = (task: TaskInterpretation): PlanResponse["steps"] => {
  const text = `${task.title} ${task.summary}`.toLowerCase();

  if (task.domain === "follow_up") {
    return [
      {
        step_number: 1,
        action: "Review prior communication context",
        detail: "Confirm when the last message was sent and what response is still needed.",
        dependencies: [],
        effort: "quick",
        delegation: "can_track",
        suggested_date: null,
        status: "ready",
      },
      {
        step_number: 2,
        action: "Draft follow-up message",
        detail: "Create a concise follow-up with the exact ask and deadline context.",
        dependencies: [{ type: "information", description: "Recipient and goal confirmed", step_ref: 1 }],
        effort: "short",
        delegation: "can_draft",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 3,
        action: "Send follow-up from your inbox",
        detail: "Review the draft, finalize tone, and send to the intended recipient.",
        dependencies: [{ type: "step", description: "Draft complete", step_ref: 2 }],
        effort: "quick",
        delegation: "user_only",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 4,
        action: "Schedule response check",
        detail: "Set a 3-day follow-up reminder if no response arrives.",
        dependencies: [{ type: "step", description: "Message sent", step_ref: 3 }],
        effort: "quick",
        delegation: "can_remind",
        suggested_date: nextDayIso(3),
        status: "pending",
      },
    ];
  }

  if (task.domain === "portal" || text.includes("nyu") || text.includes("portal")) {
    return [
      {
        step_number: 1,
        action: "Log into the target portal",
        detail: "Open the portal and navigate to the relevant request or application status screen.",
        dependencies: [],
        effort: "quick",
        delegation: "user_only",
        suggested_date: null,
        status: "ready",
      },
      {
        step_number: 2,
        action: "Verify checklist and missing items",
        detail: "Identify required documents, pending actions, and any hard submission deadlines.",
        dependencies: [{ type: "step", description: "Portal access", step_ref: 1 }],
        effort: "short",
        delegation: "can_track",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 3,
        action: "Capture next required action",
        detail: "Record the exact next submission or follow-up needed from the portal status.",
        dependencies: [{ type: "step", description: "Checklist verified", step_ref: 2 }],
        effort: "short",
        delegation: "user_only",
        suggested_date: null,
        status: "pending",
      },
    ];
  }

  if (task.domain === "financial" || text.includes("fafsa") || text.includes("aid")) {
    return [
      {
        step_number: 1,
        action: "Check FAFSA/aid status",
        detail: "Confirm completion state and whether verification documents are requested.",
        dependencies: [],
        effort: "short",
        delegation: "user_only",
        suggested_date: null,
        status: "ready",
      },
      {
        step_number: 2,
        action: "List required financial documents",
        detail: "Create a checklist of all requested documents and missing fields.",
        dependencies: [{ type: "step", description: "Status checked", step_ref: 1 }],
        effort: "short",
        delegation: "can_track",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 3,
        action: "Set submission reminders",
        detail: "Schedule escalating reminders ahead of the latest acceptable date.",
        dependencies: [{ type: "step", description: "Requirements confirmed", step_ref: 2 }],
        effort: "quick",
        delegation: "can_remind",
        suggested_date: nextDayIso(1),
        status: "pending",
      },
    ];
  }

  if (task.domain === "job_application") {
    return [
      {
        step_number: 1,
        action: "Open job application status",
        detail: "Review the application timeline and current hiring stage.",
        dependencies: [],
        effort: "quick",
        delegation: "user_only",
        suggested_date: null,
        status: "ready",
      },
      {
        step_number: 2,
        action: "Draft targeted follow-up",
        detail: "Prepare a concise follow-up email tailored to the role and timeline.",
        dependencies: [{ type: "step", description: "Status reviewed", step_ref: 1 }],
        effort: "short",
        delegation: "can_draft",
        suggested_date: null,
        status: "pending",
      },
      {
        step_number: 3,
        action: "Send follow-up and track response",
        detail: "Send the message and monitor for response within 3 business days.",
        dependencies: [{ type: "step", description: "Draft completed", step_ref: 2 }],
        effort: "quick",
        delegation: "can_track",
        suggested_date: nextDayIso(3),
        status: "pending",
      },
    ];
  }

  return [
    {
      step_number: 1,
      action: "Confirm task objective",
      detail: `Define the exact output expected for: ${task.title}.`,
      dependencies: [],
      effort: "quick",
      delegation: "user_only",
      suggested_date: null,
      status: "ready",
    },
    {
      step_number: 2,
      action: "Prepare first draft/checklist",
      detail: "Generate a concrete first version to accelerate execution.",
      dependencies: [{ type: "step", description: "Objective confirmed", step_ref: 1 }],
      effort: "short",
      delegation: "can_draft",
      suggested_date: null,
      status: "pending",
    },
    {
      step_number: 3,
      action: "Schedule follow-up checkpoint",
      detail: "Set a reminder to review outcome and unblock next step.",
      dependencies: [{ type: "step", description: "Initial output ready", step_ref: 2 }],
      effort: "quick",
      delegation: "can_remind",
      suggested_date: nextDayIso(2),
      status: "pending",
    },
  ];
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
  const steps = buildPlanSteps(task);
  const deadline = extractDeadline(task);
  const delegationSummary = steps.reduce(
    (acc, step) => {
      if (step.delegation === "can_draft") acc.can_draft += 1;
      if (step.delegation === "can_remind") acc.can_remind += 1;
      if (step.delegation === "can_track") acc.can_track += 1;
      if (step.delegation === "user_only") acc.user_only += 1;
      return acc;
    },
    { can_draft: 0, can_remind: 0, can_track: 0, user_only: 0 }
  );

  return {
    task_id: task.task_id,
    title: task.title,
    plan_id: planId,
    total_steps: steps.length,
    estimated_total_effort: steps.length >= 4 ? "medium" : "short",
    deadline,
    steps,
    risk_flags: [
      {
        risk: "Required credentials or documents may be missing at execution time.",
        severity: "medium",
        mitigation: "Confirm account access and required documents before starting step 1.",
      },
    ],
    next_action: {
      step_number: 1,
      action: steps[0]?.action ?? "Start first concrete action",
      why_first: "This unlocks the rest of the plan and confirms current status.",
    },
    delegation_summary: delegationSummary,
  };
};

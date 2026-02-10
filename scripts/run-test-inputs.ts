import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { interpretInput } from "../lib/ai/interpret";
import { buildPlan } from "../lib/ai/plan";

dotenv.config({ path: resolve(".env.local") });
dotenv.config();

const inputs = [
  "I applied to 4 jobs on Indeed this week and I need to follow up on a scholarship I submitted to the Jack Kent Cooke Foundation 12 days ago -- also my AP Lit assignment is due Friday on AP Classroom",
  "I need to deal with my financial aid situation",
  "I need to register for the AP Computer Science exam before the late deadline",
  "I emailed Professor Williams about a recommendation letter 3 days ago and haven't heard back. I also applied to a software engineer role at Stripe on Indeed last Monday.",
  "Complete the QuestBridge scholarship application. Deadline is in 18 days. I have my transcript but need a recommendation letter and my personal essay.",
];

const makePlaceholder = (input: string, taskIndex: number) => ({
  task_id: `dry-task-${taskIndex + 1}`,
  title: `Placeholder interpretation for: ${input.slice(0, 48)}...`,
  summary: "Dry run placeholder (no API calls).",
  domain: "other",
  urgency: "medium",
  complexity: "moderate",
  entities: [],
  dates: [],
  status: {
    what_is_done: "",
    what_is_pending: "",
    blockers: [],
  },
  ambiguities: [],
  hidden_dependencies: [],
});

const makePlanPlaceholder = (taskId: string) => ({
  task_id: taskId,
  title: "Placeholder plan",
  plan_id: `dry-plan-${taskId}`,
  total_steps: 2,
  estimated_total_effort: "short",
  deadline: null,
  steps: [
    {
      step_number: 1,
      action: "Draft output",
      detail: "Placeholder step (dry run).",
      dependencies: [],
      effort: "short",
      delegation: "can_draft",
      suggested_date: null,
      status: "pending",
    },
    {
      step_number: 2,
      action: "Review and finalize",
      detail: "Placeholder step (dry run).",
      dependencies: [{ type: "step", description: "Draft ready", step_ref: 1 }],
      effort: "quick",
      delegation: "user_only",
      suggested_date: null,
      status: "pending",
    },
  ],
  risk_flags: [],
  next_action: {
    step_number: 1,
    action: "Draft output",
    why_first: "Placeholder ordering.",
  },
  delegation_summary: {
    can_draft: 1,
    can_remind: 0,
    can_track: 0,
    user_only: 1,
  },
});

const run = async () => {
  const dryRun = process.env.DRY_RUN === "true" || process.argv.includes("--dry");
  const results = [] as Array<{
    input: string;
    interpretation: unknown;
    plans: unknown[];
  }>;

  for (const [index, input] of inputs.entries()) {
    if (dryRun) {
      const placeholderTask = makePlaceholder(input, index);
      results.push({
        input,
        interpretation: {
          data: {
            raw_input: input,
            request_count: 1,
            tasks: [placeholderTask],
            cross_task_dependencies: [],
          },
        },
        plans: [{ data: makePlanPlaceholder(placeholderTask.task_id) }],
      });
      continue;
    }

    const interpretation = await interpretInput(input);

    if ("error" in interpretation) {
      results.push({ input, interpretation, plans: [] });
      continue;
    }

    const plans: unknown[] = [];
    for (const task of interpretation.data.tasks) {
      const planResult = await buildPlan(task);
      plans.push(planResult);
    }

    results.push({ input, interpretation, plans });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    dry_run: dryRun,
    results,
  };

  const outputPath = resolve("docs", "test-results.json");
  writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Saved test results to ${outputPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
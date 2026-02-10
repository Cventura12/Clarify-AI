import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const request = await prisma.request.create({
    data: {
      rawInput: "Follow up on my scholarship and finish AP Lit homework",
      requestCount: 1,
      crossTaskDeps: [],
      tasks: {
        create: [
          {
            title: "Follow up on scholarship submission",
            summary: "Send a polite follow-up to confirm receipt and timeline.",
            domain: "scholarship",
            urgency: "medium",
            complexity: "simple",
            entities: [{ name: "Jack Kent Cooke Foundation", type: "organization" }],
            dates: [{ description: "Follow up window", date: null, source: "unknown" }],
            status: {
              what_is_done: "Application submitted",
              what_is_pending: "Follow-up communication",
              blockers: [],
            },
            ambiguities: [],
            hiddenDependencies: [],
            taskStatus: "interpreted",
          },
        ],
      },
    },
    include: { tasks: true },
  });

  const task = request.tasks[0];

  if (!task) return;

  await prisma.plan.create({
    data: {
      taskId: task.id,
      totalSteps: 2,
      estimatedTotalEffort: "short",
      delegationSummary: {
        can_draft: 1,
        can_remind: 1,
        can_track: 0,
        user_only: 0,
      },
      riskFlags: [],
      nextAction: {
        step_number: 1,
        action: "Draft follow-up email",
        why_first: "You need the message ready before sending.",
      },
      steps: {
        create: [
          {
            stepNumber: 1,
            action: "Draft follow-up email",
            detail: "Write a concise email asking for status and timeline.",
            dependencies: [],
            effort: "short",
            delegation: "can_draft",
            status: "pending",
          },
          {
            stepNumber: 2,
            action: "Send follow-up email",
            detail: "Send the draft after confirming the recipient.",
            dependencies: [{ type: "step", description: "Draft ready", step_ref: 1 }],
            effort: "quick",
            delegation: "user_only",
            status: "pending",
          },
        ],
      },
    },
  });

  console.log("Seeded sample request", request.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

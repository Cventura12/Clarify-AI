const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@clarify.ai" },
    update: {},
    create: {
      email: "demo@clarify.ai",
      obligations: {
        create: [{ name: "Submit scholarship application", dueAt: new Date() }]
      }
    }
  });

  const pipeline = await prisma.pipeline.create({
    data: {
      userId: user.id,
      sourceText: "Follow up on my internship application",
      status: "PLANNING",
      steps: {
        create: [
          {
            title: "Draft follow-up email",
            order: 1,
            status: "QUEUED",
            actionType: "DRAFT_EMAIL"
          },
          {
            title: "Schedule reminder for next week",
            order: 2,
            status: "QUEUED",
            actionType: "SET_REMINDER"
          }
        ]
      }
    }
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      pipelineId: pipeline.id,
      title: "Follow up with recruiter",
      description: "Send a polite update request",
      status: "QUEUED",
      priority: 3
    }
  });

  console.log("Seeded user:", user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

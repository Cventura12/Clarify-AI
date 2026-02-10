import { prisma } from "@/lib/db";
import { buildEscalatingReminders } from "@/lib/deadlines/reminders";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json({ reminders: buildEscalatingReminders(tasks) });
  } catch (error) {
    console.error("Reminders API error", error);
    return Response.json({ error: { message: "Failed to load reminders" } }, { status: 500 });
  }
}

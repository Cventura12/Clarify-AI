import { prisma } from "@/lib/db";
import { buildEscalatingReminders } from "@/lib/deadlines/reminders";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { request: { userId } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ reminders: buildEscalatingReminders(tasks) });
  } catch (error) {
    console.error("Reminders API error", error);
    return Response.json({ error: { message: "Failed to load reminders" } }, { status: 500 });
  }
}

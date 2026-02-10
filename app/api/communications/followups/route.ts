import { prisma } from "@/lib/db";
import { getFollowUpSuggestions } from "@/lib/communications/followups";
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

    return Response.json({ suggestions: getFollowUpSuggestions(tasks) });
  } catch (error) {
    console.error("Followups API error", error);
    return Response.json({ error: { message: "Failed to load follow-up suggestions" } }, { status: 500 });
  }
}

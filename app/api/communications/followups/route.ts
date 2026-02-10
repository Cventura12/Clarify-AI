import { prisma } from "@/lib/db";
import { getFollowUpSuggestions } from "@/lib/communications/followups";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ suggestions: getFollowUpSuggestions(tasks) });
  } catch (error) {
    console.error("Followups API error", error);
    return Response.json({ error: { message: "Failed to load follow-up suggestions" } }, { status: 500 });
  }
}
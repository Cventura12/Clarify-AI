import { buildPlan } from "@/lib/plan";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const taskTitle = body?.taskTitle?.trim();

  if (!taskTitle) {
    return Response.json({ error: "taskTitle is required" }, { status: 400 });
  }

  const result = buildPlan(taskTitle);
  return Response.json(result);
}

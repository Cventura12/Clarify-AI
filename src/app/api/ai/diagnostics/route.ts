import { buildReasoningPlan } from "@/lib/ai/reasoning";
import { scoreConfidence } from "@/lib/ai/confidence";
import { buildFallbacks } from "@/lib/ai/fallback";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const task = body?.task?.trim();

  if (!task) {
    return Response.json({ error: "task is required" }, { status: 400 });
  }

  const reasoning = buildReasoningPlan(task);
  const confidence = scoreConfidence(0.68);
  const fallbacks = buildFallbacks(task);

  return Response.json({ reasoning, confidence, fallbacks });
}

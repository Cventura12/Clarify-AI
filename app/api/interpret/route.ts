import { authOptions } from "@/lib/auth";
import { createInterpretedRequest } from "@/lib/requests/create-interpreted-request";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const input = body?.input?.trim();

    if (!input) {
      return Response.json({ error: { message: "Input is required" } }, { status: 400 });
    }

    const created = await createInterpretedRequest({ userId, input });

    return Response.json({
      requestId: created.requestId,
      interpretation: created.interpretation,
      confidence: created.confidence,
      fallback: created.fallback,
      error: created.aiError,
    });
  } catch (error) {
    console.error("Interpret route error", error);
    return Response.json({ error: { message: "Failed to interpret request" } }, { status: 500 });
  }
}

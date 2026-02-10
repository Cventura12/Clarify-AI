import { executeAuthorizedStep } from "@/lib/plan/executor";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const result = await executeAuthorizedStep(params.id);
    if (!result.ok) {
      return Response.json({ error: { message: result.message } }, { status: result.status });
    }

    return Response.json({ step: result.step });
  } catch (error) {
    console.error("Execute step error", error);
    return Response.json({ error: { message: "Failed to execute step" } }, { status: 500 });
  }
}

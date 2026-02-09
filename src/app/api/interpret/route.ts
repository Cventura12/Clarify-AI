import { interpretInput } from "@/lib/interpret";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = body?.input?.trim();

  if (!input) {
    return Response.json({ error: "Input is required" }, { status: 400 });
  }

  const result = await interpretInput(input);
  return Response.json(result);
}

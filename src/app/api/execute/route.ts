import { buildActions, executeAction } from "@/lib/execute";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const stepTitle = body?.stepTitle?.trim();

  if (!stepTitle) {
    return Response.json({ error: "stepTitle is required" }, { status: 400 });
  }

  const actions = buildActions(stepTitle);
  return Response.json({ stepTitle, actions });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (!action) {
    return Response.json({ error: "action is required" }, { status: 400 });
  }

  const result = await executeAction(action);
  return Response.json({ result });
}

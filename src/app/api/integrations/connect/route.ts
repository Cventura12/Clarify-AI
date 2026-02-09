import { buildOAuthUrl } from "@/lib/integrations/oauth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const provider = body?.provider as "google" | "notion" | "slack" | undefined;

  if (!provider) {
    return Response.json({ error: "provider is required" }, { status: 400 });
  }

  const url = buildOAuthUrl(provider);
  return Response.json({ url });
}

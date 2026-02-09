import { integrationRegistry } from "@/lib/integrations/registry";

export async function GET() {
  return Response.json({ integrations: integrationRegistry });
}

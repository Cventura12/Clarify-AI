import { EMAIL_TEMPLATES } from "@/lib/communications/templates";

export async function GET() {
  return Response.json({ templates: EMAIL_TEMPLATES });
}
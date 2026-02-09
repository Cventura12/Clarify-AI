import { syncGoogleCalendar } from "@/lib/integrations/google/calendar";

export async function POST() {
  const result = await syncGoogleCalendar();
  return Response.json(result);
}

import { prisma } from "@/lib/db";
import { getGoogleAuthUrl } from "@/lib/integrations/google";

export async function GET() {
  try {
    const state = crypto.randomUUID();

    const existing = await prisma.integration.findUnique({
      where: { provider: "google_calendar" },
    });

    const mergedMetadata = {
      ...(existing?.metadata as Record<string, unknown> | null),
      oauthState: state,
      calendarId:
        typeof (existing?.metadata as Record<string, unknown> | null)?.calendarId === "string"
          ? (existing?.metadata as Record<string, unknown>).calendarId
          : "primary",
    };

    await prisma.integration.upsert({
      where: { provider: "google_calendar" },
      update: {
        status: "pending",
        metadata: mergedMetadata,
      },
      create: {
        provider: "google_calendar",
        status: "pending",
        metadata: mergedMetadata,
      },
    });

    const url = getGoogleAuthUrl(state);
    return Response.redirect(url);
  } catch (error) {
    console.error("Google authorize error", error);
    return Response.json({ error: { message: "Failed to start OAuth flow" } }, { status: 500 });
  }
}

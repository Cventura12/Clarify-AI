import { prisma } from "@/lib/db";
import { getGoogleAuthUrl } from "@/lib/integrations/google";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const state = crypto.randomUUID();

    const existing = await prisma.integration.findUnique({
      where: { provider_userId: { provider: "google", userId } },
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
      where: { provider_userId: { provider: "google", userId } },
      update: {
        status: "pending",
        metadata: mergedMetadata,
      },
      create: {
        provider: "google",
        status: "pending",
        metadata: mergedMetadata,
        userId,
      },
    });

    const url = getGoogleAuthUrl(state);
    return Response.redirect(url);
  } catch (error) {
    console.error("Google authorize error", error);
    return Response.json({ error: { message: "Failed to start OAuth flow" } }, { status: 500 });
  }
}

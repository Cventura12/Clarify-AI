import { prisma } from "@/lib/db";
import { getGoogleAuthUrl } from "@/lib/integrations/google";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { JsonValue } from "@prisma/client/runtime/library";

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

    const baseMetadata = (existing?.metadata as Record<string, JsonValue> | null) ?? {};
    const calendarId =
      typeof baseMetadata.calendarId === "string" ? baseMetadata.calendarId : "primary";
    const mergedMetadata: Record<string, JsonValue> = {
      ...baseMetadata,
      oauthState: state,
      calendarId,
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

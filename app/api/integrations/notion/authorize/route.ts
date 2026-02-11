import { prisma } from "@/lib/db";
import { getNotionAuthUrl } from "@/lib/integrations/notion";
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
      where: { provider_userId: { provider: "notion", userId } },
    });

    const baseMetadata = (existing?.metadata as Record<string, JsonValue> | null) ?? {};
    const mergedMetadata: Record<string, JsonValue> = {
      ...baseMetadata,
      oauthState: state,
    };

    await prisma.integration.upsert({
      where: { provider_userId: { provider: "notion", userId } },
      update: {
        status: "pending",
        metadata: mergedMetadata,
      },
      create: {
        provider: "notion",
        status: "pending",
        metadata: mergedMetadata,
        userId,
      },
    });

    const url = getNotionAuthUrl(state);
    return Response.redirect(url);
  } catch (error) {
    console.error("Notion authorize error", error);
    return Response.json({ error: { message: "Failed to start Notion OAuth flow" } }, { status: 500 });
  }
}

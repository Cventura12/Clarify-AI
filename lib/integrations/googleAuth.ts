import { prisma } from "@/lib/db";
import { refreshGoogleToken } from "@/lib/integrations/google";

export const getGoogleIntegration = async (userId: string) => {
  const integration = await prisma.integration.findUnique({
    where: {
      provider_userId: {
        provider: "google",
        userId,
      },
    },
  });

  if (!integration) {
    throw new Error("Google integration not connected");
  }

  const metadata = (integration.metadata as Record<string, unknown> | null) ?? {};
  let accessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
  const refreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";
  const calendarId = typeof metadata.calendarId === "string" ? metadata.calendarId : "primary";
  const expiresAt = typeof metadata.expiresAt === "string" ? metadata.expiresAt : "";

  const needsRefresh = () => {
    if (!expiresAt) return !accessToken;
    const expiry = new Date(expiresAt).getTime();
    return Number.isNaN(expiry) || Date.now() > expiry - 60 * 1000;
  };

  if (needsRefresh() && refreshToken) {
    const refreshed = await refreshGoogleToken(refreshToken);
    accessToken = refreshed.accessToken;
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        metadata: {
          ...metadata,
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt,
          refreshedAt: new Date().toISOString(),
        },
      },
    });
  }

  if (!accessToken) {
    throw new Error("Missing Google access token");
  }

  return {
    integration,
    accessToken,
    calendarId,
  };
};

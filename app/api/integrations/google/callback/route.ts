import { prisma } from "@/lib/db";
import { exchangeGoogleCode } from "@/lib/integrations/google";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return Response.json({ error: { message: "Missing code or state" } }, { status: 400 });
    }

    const integration = await prisma.integration.findUnique({
      where: { provider: "google_calendar" },
    });

    const metadata = (integration?.metadata as Record<string, unknown> | null) ?? {};
    const storedState = metadata.oauthState;

    if (!integration || typeof storedState !== "string" || storedState !== state) {
      return Response.json({ error: { message: "Invalid OAuth state" } }, { status: 400 });
    }

    const token = await exchangeGoogleCode(code);
    const calendarId = typeof metadata.calendarId === "string" ? metadata.calendarId : "primary";

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: "connected",
        metadata: {
          ...metadata,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken ?? metadata.refreshToken ?? null,
          expiresAt: token.expiresAt,
          scope: token.scope,
          calendarId,
          oauthState: null,
        },
      },
    });

    return Response.redirect(new URL("/integrations?status=connected", request.url));
  } catch (error) {
    console.error("Google callback error", error);
    return Response.json({ error: { message: "Failed to complete OAuth flow" } }, { status: 500 });
  }
}

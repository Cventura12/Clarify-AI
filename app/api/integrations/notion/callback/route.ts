import { prisma } from "@/lib/db";
import { exchangeNotionCode } from "@/lib/integrations/notion";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return Response.json({ error: { message: "Missing code or state" } }, { status: 400 });
    }

    const integration = await prisma.integration.findUnique({
      where: { provider_userId: { provider: "notion", userId } },
    });

    const metadata = (integration?.metadata as Record<string, unknown> | null) ?? {};
    const storedState = metadata.oauthState;

    if (!integration || typeof storedState !== "string" || storedState !== state) {
      return Response.json({ error: { message: "Invalid OAuth state" } }, { status: 400 });
    }

    const token = await exchangeNotionCode(code);

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        status: "connected",
        metadata: {
          ...metadata,
          accessToken: token.accessToken,
          workspaceName: token.workspaceName,
          workspaceIcon: token.workspaceIcon,
          workspaceId: token.workspaceId,
          botId: token.botId,
          oauthState: null,
        },
      },
    });

    return Response.redirect(new URL("/integrations?status=connected&provider=notion", request.url));
  } catch (error) {
    console.error("Notion callback error", error);
    return Response.json({ error: { message: "Failed to complete Notion OAuth flow" } }, { status: 500 });
  }
}

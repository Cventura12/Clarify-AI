import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleIntegration } from "@/lib/integrations/googleAuth";
import { listGmailMessages } from "@/lib/integrations/gmail";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "newer_than:30d";
    const limit = Number(searchParams.get("limit") ?? 10);

    const { accessToken } = await getGoogleIntegration(userId);
    const messages = await listGmailMessages(accessToken, query, Number.isNaN(limit) ? 10 : limit);

    return Response.json({ messages });
  } catch (error) {
    console.error("Gmail messages error", error);
    const message = error instanceof Error ? error.message : "Failed to load Gmail messages";
    return Response.json({ error: { message } }, { status: 500 });
  }
}

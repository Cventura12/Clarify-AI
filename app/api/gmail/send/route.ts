import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleIntegration } from "@/lib/integrations/googleAuth";
import { sendGmailMessage } from "@/lib/integrations/gmail";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const to = body?.to?.trim();
    const subject = body?.subject?.trim();
    const bodyText = body?.body?.trim();

    if (!to || !subject || !bodyText) {
      return Response.json({ error: { message: "To, subject, and body are required" } }, { status: 400 });
    }

    const { accessToken } = await getGoogleIntegration(userId);
    const result = await sendGmailMessage(accessToken, { to, subject, body: bodyText });

    return Response.json({ result });
  } catch (error) {
    console.error("Gmail send error", error);
    const message = error instanceof Error ? error.message : "Failed to send Gmail message";
    return Response.json({ error: { message } }, { status: 500 });
  }
}

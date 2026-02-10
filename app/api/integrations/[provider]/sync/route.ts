import { prisma } from "@/lib/db";
import {
  buildEventsFromTasks,
  pushEventsToGoogle,
  refreshGoogleToken,
  testGoogleCalendarConnection,
  type CalendarEventInput,
} from "@/lib/integrations/google";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const provider = params.provider;
    const body = await request.json().catch(() => null);
    const dryRun = Boolean(body?.dryRun);
    const testOnly = Boolean(body?.testOnly);
    const refreshOnly = Boolean(body?.refreshOnly);

    const integration = await prisma.integration.findUnique({
      where: {
        provider_userId: { provider, userId },
      },
    });

    if (!integration) {
      return Response.json({ error: { message: "Integration not found" } }, { status: 404 });
    }

    if (provider !== "google") {
      return Response.json({ error: { message: "Unsupported provider" } }, { status: 400 });
    }

    const metadata = (integration.metadata as Record<string, unknown> | null) ?? {};
    let accessToken = typeof metadata.accessToken === "string" ? metadata.accessToken : "";
    const refreshToken = typeof metadata.refreshToken === "string" ? metadata.refreshToken : "";
    const calendarId = typeof metadata.calendarId === "string" ? metadata.calendarId : "";
    const expiresAt = typeof metadata.expiresAt === "string" ? metadata.expiresAt : "";

    const needsRefresh = () => {
      if (!expiresAt) return !accessToken;
      const expiry = new Date(expiresAt).getTime();
      return Number.isNaN(expiry) || Date.now() > expiry - 60 * 1000;
    };

    if (refreshOnly) {
      if (!refreshToken) {
        return Response.json({ error: { message: "No refresh token available" } }, { status: 400 });
      }
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
      return Response.json({ refreshed: true });
    }

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

    if (!accessToken || !calendarId) {
      return Response.json({ error: { message: "Missing access token or calendar id" } }, { status: 400 });
    }

    if (testOnly) {
      const test = await testGoogleCalendarConnection({ accessToken, calendarId });
      const sync = await prisma.integrationSync.create({
        data: {
          integrationId: integration.id,
          status: "tested",
          result: test,
        },
      });
      return Response.json({ sync, result: test });
    }

    const tasks = await prisma.task.findMany({
      where: { request: { userId } },
      orderBy: { createdAt: "desc" },
    });
    const events = buildEventsFromTasks(tasks);
    type CreatedEvent = { id?: string; status: string; summary: string };
    type SyncResult =
      | { dryRun: true; events: CalendarEventInput[] }
      | { dryRun: false; events: CreatedEvent[] };
    let result: SyncResult = { dryRun: true, events };

    if (!dryRun) {
      const created = await pushEventsToGoogle({ accessToken, calendarId }, events);
      result = { dryRun: false, events: created };
    }

    const sync = await prisma.integrationSync.create({
      data: {
        integrationId: integration.id,
        status: "completed",
        result,
      },
    });

    return Response.json({ sync, result });
  } catch (error) {
    console.error("Integration sync error", error);
    return Response.json({ error: { message: "Failed to sync integration" } }, { status: 500 });
  }
}

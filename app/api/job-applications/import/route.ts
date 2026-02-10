import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleIntegration } from "@/lib/integrations/googleAuth";
import { findJobApplications } from "@/lib/integrations/gmail";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { accessToken } = await getGoogleIntegration(userId);
    const found = await findJobApplications(accessToken, 10);

    const created: Array<{ id: string; company: string; role: string }> = [];

    for (const item of found) {
      const exists = await prisma.jobApplication.findFirst({
        where: { userId, emailThreadId: item.threadId },
      });
      if (exists) continue;

      const application = await prisma.jobApplication.create({
        data: {
          userId,
          company: item.company,
          role: item.role,
          status: "applied",
          source: "gmail",
          appliedAt: item.appliedAt ?? undefined,
          emailThreadId: item.threadId,
        },
      });
      created.push({ id: application.id, company: application.company, role: application.role });
    }

    return Response.json({ imported: created.length, applications: created });
  } catch (error) {
    console.error("Job application import error", error);
    const message = error instanceof Error ? error.message : "Failed to import job applications";
    return Response.json({ error: { message } }, { status: 500 });
  }
}

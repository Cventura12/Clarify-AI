import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const JobSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  status: z.string().optional(),
  appliedAt: z.string().optional(),
  portalUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ applications });
  } catch (error) {
    console.error("Job applications GET error", error);
    return Response.json({ error: { message: "Failed to load job applications" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = JobSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const appliedAt = parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : null;

    const created = await prisma.jobApplication.create({
      data: {
        userId,
        company: parsed.data.company,
        role: parsed.data.role,
        status: parsed.data.status ?? "applied",
        source: "manual",
        appliedAt: appliedAt ?? undefined,
        portalUrl: parsed.data.portalUrl ?? undefined,
        notes: parsed.data.notes ?? undefined,
      },
    });

    return Response.json({ application: created }, { status: 201 });
  } catch (error) {
    console.error("Job applications POST error", error);
    return Response.json({ error: { message: "Failed to create job application" } }, { status: 500 });
  }
}

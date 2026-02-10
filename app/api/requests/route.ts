import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const requests = await prisma.request.findMany({
      where: { userId },
      include: {
        tasks: {
          include: {
            plan: { include: { steps: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ requests });
  } catch (error) {
    console.error("Requests GET error", error);
    return Response.json({ error: { message: "Failed to load requests" } }, { status: 500 });
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
    const rawInput = body?.rawInput?.trim();

    if (!rawInput) {
      return Response.json({ error: { message: "rawInput is required" } }, { status: 400 });
    }

    const created = await prisma.request.create({
      data: {
        userId,
        rawInput,
        requestCount: body?.requestCount ?? 1,
        crossTaskDeps: body?.crossTaskDeps ?? [],
      },
    });

    return Response.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("Requests POST error", error);
    return Response.json({ error: { message: "Failed to create request" } }, { status: 500 });
  }
}

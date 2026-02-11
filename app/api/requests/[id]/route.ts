import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const request = await prisma.request.findUnique({
      where: { id: params.id, userId },
      include: {
        tasks: {
          include: {
            plan: { include: { steps: true } },
          },
        },
      },
    });

    if (!request) {
      return Response.json({ error: { message: "Request not found" } }, { status: 404 });
    }

    return Response.json({ request });
  } catch (error) {
    console.error("Request GET error", error);
    return Response.json({ error: { message: "Failed to load request" } }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    const updated = await prisma.request.update({
      where: { id: params.id, userId },
      data: {
        rawInput: body?.rawInput,
        crossTaskDeps: body?.crossTaskDeps,
      },
    });

    return Response.json({ request: updated });
  } catch (error) {
    console.error("Request PATCH error", error);
    return Response.json({ error: { message: "Failed to update request" } }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const existing = await prisma.request.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });

    if (!existing) {
      return Response.json({ error: { message: "Request not found" } }, { status: 404 });
    }

    await prisma.request.delete({
      where: { id: existing.id },
    });

    return Response.json({ deletedId: existing.id });
  } catch (error) {
    console.error("Request DELETE error", error);
    return Response.json({ error: { message: "Failed to delete request" } }, { status: 500 });
  }
}

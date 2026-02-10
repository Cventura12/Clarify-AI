import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const request = await prisma.request.findUnique({
      where: { id: params.id },
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
    const body = await request.json().catch(() => null);

    const updated = await prisma.request.update({
      where: { id: params.id },
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

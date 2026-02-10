import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider;
    const payload = await request.json().catch(() => null);

    const integration = await prisma.integration.upsert({
      where: { provider },
      update: {},
      create: { provider, status: "connected" },
    });

    const event = await prisma.integrationEvent.create({
      data: {
        integrationId: integration.id,
        eventType: "webhook",
        payload,
      },
    });

    return Response.json({ event });
  } catch (error) {
    console.error("Webhook error", error);
    return Response.json({ error: { message: "Failed to record webhook" } }, { status: 500 });
  }
}

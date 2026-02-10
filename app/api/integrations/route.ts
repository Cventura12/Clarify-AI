import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { JsonValue } from "@prisma/client/runtime/library";

const IntegrationSchema = z.object({
  provider: z.string(),
  status: z.string().optional(),
  metadata: z.record(z.any()).nullable().optional(),
  replaceMetadata: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const integrations = await prisma.integration.findMany({
      where: { userId },
      include: {
        syncs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { provider: "asc" },
    });
    return Response.json({ integrations });
  } catch (error) {
    console.error("Integrations GET error", error);
    return Response.json({ error: { message: "Failed to load integrations" } }, { status: 500 });
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
    const parsed = IntegrationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid integration payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const existing = await prisma.integration.findUnique({
      where: {
        provider_userId: { provider: parsed.data.provider, userId },
      },
    });

    const mergeMetadata = (
      base: Record<string, JsonValue> | null,
      incoming: Record<string, JsonValue> | null
    ): Record<string, JsonValue> => ({
      ...(base ?? {}),
      ...(incoming ?? {}),
    });

    const toJsonObject = (value: Record<string, unknown> | null | undefined) =>
      (value ?? {}) as Record<string, JsonValue>;

    const integration = existing
      ? await prisma.integration.update({
          where: { id: existing.id },
          data: {
            status: parsed.data.status ?? existing.status,
            metadata: parsed.data.replaceMetadata
              ? toJsonObject(parsed.data.metadata ?? {})
              : mergeMetadata(
                  (existing.metadata as Record<string, JsonValue> | null) ?? null,
                  (parsed.data.metadata as Record<string, JsonValue> | null) ?? null
                ),
          },
        })
      : await prisma.integration.create({
          data: {
            provider: parsed.data.provider,
            status: parsed.data.status ?? "connected",
            metadata: toJsonObject(parsed.data.metadata ?? {}),
            userId,
          },
        });

    return Response.json({ integration });
  } catch (error) {
    console.error("Integrations POST error", error);
    return Response.json({ error: { message: "Failed to save integration" } }, { status: 500 });
  }
}

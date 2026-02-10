import { z } from "zod";
import { prisma } from "@/lib/db";

const MemorySchema = z.object({
  type: z.string(),
  content: z.string().min(1),
  source: z.string().optional(),
});

export async function GET() {
  try {
    const entries = await prisma.memoryEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Response.json({ entries });
  } catch (error) {
    console.error("Memory GET error", error);
    return Response.json({ error: { message: "Failed to load memory" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = MemorySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { message: "Invalid memory payload", issues: parsed.error.flatten() } },
        { status: 400 }
      );
    }

    const entry = await prisma.memoryEntry.create({
      data: {
        type: parsed.data.type,
        content: parsed.data.content,
        source: parsed.data.source ?? "user",
      },
    });

    return Response.json({ entry });
  } catch (error) {
    console.error("Memory POST error", error);
    return Response.json({ error: { message: "Failed to save memory" } }, { status: 500 });
  }
}

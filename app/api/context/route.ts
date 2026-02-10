import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const nodes = await prisma.contextNode.findMany({
      orderBy: { createdAt: "desc" },
    });
    const edges = await prisma.contextEdge.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ nodes, edges });
  } catch (error) {
    console.error("Context GET error", error);
    return Response.json({ error: { message: "Failed to load context graph" } }, { status: 500 });
  }
}

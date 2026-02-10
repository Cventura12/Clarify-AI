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

    const nodes = await prisma.contextNode.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const edges = await prisma.contextEdge.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ nodes, edges });
  } catch (error) {
    console.error("Context GET error", error);
    return Response.json({ error: { message: "Failed to load context graph" } }, { status: 500 });
  }
}

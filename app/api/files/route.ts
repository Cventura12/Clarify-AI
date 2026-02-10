import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";

    const where = {
      ...(type ? { type } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { contentText: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
      step: {
        plan: {
          task: {
            request: {
              userId,
            },
          },
        },
      },
    };

    const files = await prisma.fileArtifact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return Response.json({ files });
  } catch (error) {
    console.error("Files API error", error);
    return Response.json({ error: { message: "Failed to fetch files" } }, { status: 500 });
  }
}

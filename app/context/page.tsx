import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function ContextPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view context.
      </div>
    );
  }

  const nodes = await prisma.contextNode.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const edges = await prisma.contextEdge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Context graph</p>
        <h1 className="font-display text-3xl text-slate-900">User context</h1>
        <p className="text-sm text-slate-500">Nodes and relationships Clarify has learned.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Nodes</p>
            <span className="text-xs text-slate-400">{nodes.length} items</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {nodes.length === 0 ? (
              <p className="text-sm text-slate-500">No context nodes yet.</p>
            ) : (
              nodes.map((node) => (
                <div key={node.id} className="rounded-lg border border-[#ebe8e3] bg-[#fbfaf8] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{node.type}</p>
                  <p className="text-sm font-semibold text-slate-800">{node.label}</p>
                  {node.metadata ? (
                    <p className="text-xs text-slate-400">{JSON.stringify(node.metadata)}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Edges</p>
            <span className="text-xs text-slate-400">{edges.length} items</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {edges.length === 0 ? (
              <p className="text-sm text-slate-500">No edges yet.</p>
            ) : (
              edges.map((edge) => {
                const from = nodeMap.get(edge.fromId);
                const to = nodeMap.get(edge.toId);
                return (
                  <div key={edge.id} className="rounded-lg border border-[#ebe8e3] bg-[#fbfaf8] p-3 text-xs">
                    <p className="text-slate-500">
                      {(from?.label ?? edge.fromId)} {"->"} {(to?.label ?? edge.toId)}
                    </p>
                    <p className="text-slate-400">{edge.relation}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

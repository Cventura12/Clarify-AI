import MemoryComposer from "@/components/MemoryComposer";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function MemoryPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view memory.
      </div>
    );
  }

  const entries = await prisma.memoryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Memory</p>
        <h1 className="font-display text-3xl text-slate-900">Conversation memory</h1>
        <p className="text-sm text-slate-500">Saved context across sessions.</p>
      </header>

      <MemoryComposer />

      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Entries</p>
          <span className="text-xs text-slate-400">{entries.length} items</span>
        </div>
        <div className="mt-4 space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-slate-500">No memory entries yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-[#ebe8e3] bg-[#fbfaf8] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{entry.type}</p>
                  <span className="text-xs text-slate-400">{entry.createdAt.toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{entry.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

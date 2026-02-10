import DraftCard from "@/components/DraftCard";
import { extractDraftsFromLogs } from "@/lib/communications/drafts";
import { prisma } from "@/lib/db";

export default async function DraftsPage() {
  const logs = await prisma.executionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const drafts = extractDraftsFromLogs(logs);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Drafts</p>
        <h1 className="font-display text-3xl text-slate-900">Email drafts</h1>
        <p className="text-sm text-slate-500">
          Review, edit, and mark drafts as sent.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
            No drafts yet. Execute a can_draft step to generate one.
          </div>
        ) : (
          drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)
        )}
      </div>
    </div>
  );
}
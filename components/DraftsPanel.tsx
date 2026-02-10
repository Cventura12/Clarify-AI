import type { DraftEntry } from "@/lib/communications/drafts";

export default function DraftsPanel({ drafts }: { drafts: DraftEntry[] }) {
  if (drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Drafts</p>
          <p className="text-base font-semibold text-slate-900">Latest email draft</p>
        </div>
        <p className="mt-4 text-sm text-slate-500">No drafts yet.</p>
      </div>
    );
  }

  const [latest, ...rest] = drafts;

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Drafts</p>
          <p className="text-base font-semibold text-slate-900">Latest email draft</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{latest.templateName ?? "Draft"}</span>
          <a className="font-semibold uppercase tracking-[0.2em] text-slate-500" href="/drafts">
            View all
          </a>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-600">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject</p>
          <p className="font-semibold text-slate-900">{latest.subject}</p>
          <p className="text-xs text-slate-400">{latest.createdAt.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Body</p>
          <p className="whitespace-pre-wrap text-slate-600">{latest.body}</p>
        </div>
      </div>

      {rest.length > 0 ? (
        <div className="mt-5 border-t border-[#ece9e5] pt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recent drafts</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {rest.map((draft) => (
              <div key={draft.id} className="rounded-xl border border-[#ece9e5] bg-[#fbfaf8] p-3">
                <p className="font-semibold text-slate-800">{draft.subject}</p>
                <p className="text-xs text-slate-400">{draft.createdAt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

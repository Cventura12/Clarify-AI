import type { FollowUpSuggestion } from "@/lib/communications/followups";

const badgeStyles: Record<string, string> = {
  follow_up: "bg-indigo-50 text-indigo-700",
  deadline: "bg-amber-50 text-amber-700",
  blocker: "bg-rose-50 text-rose-700",
  scheduled: "bg-sky-50 text-sky-700",
};

const accentStyles: Record<string, string> = {
  follow_up: "border-l-indigo-400 bg-indigo-50/40",
  deadline: "border-l-amber-400 bg-amber-50/40",
  blocker: "border-l-rose-400 bg-rose-50/40",
  scheduled: "border-l-sky-400 bg-sky-50/40",
};

export default function NotificationPanel({ suggestions }: { suggestions: FollowUpSuggestion[] }) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      data-motion="panel"
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Signals</p>
          <p className="text-base font-semibold text-slate-900">Needs attention</p>
        </div>
        <span className="text-xs text-slate-400">{suggestions.length} items</span>
      </div>

      <div className="mt-5 space-y-3">
        {suggestions.map((item) => (
          <div
            key={item.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 border-l-4 p-4 ${
              accentStyles[item.type] ?? "border-l-slate-300 bg-white"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-1 ${badgeStyles[item.type] ?? "bg-slate-100 text-slate-600"}`}>
                {item.dueLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

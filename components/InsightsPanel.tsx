import type { InsightSuggestion } from "@/lib/context/suggestions";

export default function InsightsPanel({ insights }: { insights: InsightSuggestion[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div
      data-motion="panel"
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Insights</p>
          <p className="text-base font-semibold text-slate-900">Pattern suggestions</p>
        </div>
        <span className="text-xs text-slate-400">{insights.length} items</span>
      </div>

      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
            <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
            <p className="text-xs text-slate-500">{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

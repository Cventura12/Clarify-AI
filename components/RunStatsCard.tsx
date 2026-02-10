type RunStatsCardProps = {
  totalRuns: number;
  executedSteps: number;
  skippedUnauthorized: number;
  skippedDependencies: number;
  lastRunAt?: Date | null;
};

export default function RunStatsCard({
  totalRuns,
  executedSteps,
  skippedUnauthorized,
  skippedDependencies,
  lastRunAt,
}: RunStatsCardProps) {
  return (
    <div
      data-motion="panel"
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Execution</p>
          <p className="text-base font-semibold text-slate-900">Run stats</p>
          <p className="text-xs text-slate-400">Last 7 days</p>
        </div>
        <span className="text-xs text-slate-400">{totalRuns} runs</span>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600">
        <div className="flex items-center justify-between">
          <span>Executed steps</span>
          <span className="font-semibold text-slate-900">{executedSteps}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Skipped (unauthorized)</span>
          <span className="font-semibold text-slate-900">{skippedUnauthorized}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Skipped (dependencies)</span>
          <span className="font-semibold text-slate-900">{skippedDependencies}</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400">
        {lastRunAt ? `Last run ${lastRunAt.toLocaleString()}` : "No runs yet"}
      </div>
    </div>
  );
}

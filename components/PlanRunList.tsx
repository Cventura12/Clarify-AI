import type { PlanRun, Plan, Task } from "@prisma/client";

type PlanRunWithPlan = PlanRun & { plan: Plan & { task: Task } };

export default function PlanRunList({ runs }: { runs: PlanRunWithPlan[] }) {
  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Plan Runs</p>
          <p className="text-sm text-slate-500">Recent sequential executions.</p>
        </div>
        <span className="text-xs text-slate-400">{runs.length} runs</span>
      </div>

      {runs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No plan runs yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {runs.map((run) => (
            <div key={run.id} className="rounded-xl border border-[#ebe8e3] bg-[#fbfaf8] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">{run.plan.task.title}</p>
                <span className="text-xs text-slate-400">{run.createdAt.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Executed: {run.executedCount}</span>
                <span>Skipped (unauthorized): {run.skippedUnauthorized}</span>
                <span>Skipped (deps): {run.skippedDependencies}</span>
                <span>Total: {run.totalSteps}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  {run.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

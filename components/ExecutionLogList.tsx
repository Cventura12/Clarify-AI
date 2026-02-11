import type { ExecutionLog } from "@prisma/client";

const statusTone: Record<string, string> = {
  authorized: "bg-amber-100 text-amber-700",
  executed: "bg-emerald-100 text-emerald-700",
  edited: "bg-indigo-100 text-indigo-700",
  sent: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-sky-100 text-sky-700",
  skipped: "bg-slate-200 text-slate-700",
  failed: "bg-red-100 text-red-700",
  created: "bg-slate-100 text-slate-600",
};

const describeDetail = (log: ExecutionLog) => {
  const detail =
    log.detail && typeof log.detail === "object" && !Array.isArray(log.detail)
      ? (log.detail as Record<string, unknown>)
      : null;

  if (!detail) return null;

  if (log.action === "Step rejected") {
    const stepNumber = typeof detail.stepNumber === "number" ? detail.stepNumber : null;
    const action = typeof detail.action === "string" ? detail.action : "step";
    return stepNumber ? `You skipped step ${stepNumber}: ${action}.` : "You skipped this step.";
  }

  if (log.action === "Step authorized") {
    const stepNumber = typeof detail.stepNumber === "number" ? detail.stepNumber : null;
    return stepNumber ? `Approved step ${stepNumber}.` : "Step approved.";
  }

  if (log.action === "Draft sent") {
    const subject = typeof detail.subject === "string" ? detail.subject : "Draft email";
    const to = typeof detail.to === "string" ? detail.to : "recipient";
    return `Sent "${subject}" to ${to}.`;
  }

  if (log.action === "Follow-up scheduled") {
    const followUpAt = typeof detail.followUpAt === "string" ? detail.followUpAt : null;
    if (!followUpAt) return "Follow-up reminder scheduled.";
    const parsed = new Date(followUpAt);
    return Number.isNaN(parsed.getTime())
      ? "Follow-up reminder scheduled."
      : `Follow-up reminder set for ${parsed.toLocaleDateString()}.`;
  }

  if (log.action === "Step executed" && typeof detail.outcome === "string") {
    return detail.outcome;
  }

  return null;
};

export default function ExecutionLogList({ logs }: { logs: ExecutionLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        No execution activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Audit trail</p>
          <p className="text-lg font-semibold text-slate-900">Execution log</p>
        </div>
        <span className="text-xs text-slate-400">{logs.length} entries</span>
      </div>

      <div className="mt-4 divide-y divide-[#ece9e5]">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-wrap items-center justify-between gap-4 py-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">{log.action}</p>
              <p className="text-xs text-slate-400">{log.createdAt.toLocaleString()}</p>
              {describeDetail(log) ? (
                <p className="mt-1 text-xs text-slate-500">
                  {describeDetail(log)}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-1 ${statusTone[log.status] ?? "bg-slate-100 text-slate-600"}`}>
                {log.status}
              </span>
              <span className="text-slate-400">{log.actor}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

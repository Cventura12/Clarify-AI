import type { ExecutionLog } from "@prisma/client";

const statusTone: Record<string, string> = {
  authorized: "bg-amber-100 text-amber-700",
  executed: "bg-emerald-100 text-emerald-700",
  edited: "bg-indigo-100 text-indigo-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  created: "bg-slate-100 text-slate-600",
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
              {log.detail ? (
                <p className="mt-1 text-xs text-slate-500">
                  {JSON.stringify(log.detail)}
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

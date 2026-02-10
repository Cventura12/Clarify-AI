import Link from "next/link";
import type { Request, Task } from "@prisma/client";

export default function HistoryList({
  requests,
}: {
  requests: Array<Request & { tasks: Task[] }>;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        No history yet. Interpret a request to start building your timeline.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">History</p>
          <p className="text-lg font-semibold text-slate-900">Recent requests</p>
        </div>
        <span className="text-xs text-slate-400">{requests.length} total</span>
      </div>

      <div className="mt-4 divide-y divide-[#ece9e5]">
        {requests.map((request) => (
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-slate-900">{request.rawInput}</p>
              <p className="text-xs text-slate-400">
                {request.createdAt.toLocaleString()} · {request.tasks.length} tasks
              </p>
            </div>
            <Link className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" href={`/request/${request.id}`}>
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
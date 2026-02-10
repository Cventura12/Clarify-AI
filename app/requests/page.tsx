import Link from "next/link";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const statusTone: Record<string, string> = {
  interpreted: "bg-slate-100 text-slate-600",
  planned: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  blocked: "bg-rose-100 text-rose-700",
  abandoned: "bg-slate-200 text-slate-500",
};

const urgencyTone: Record<string, string> = {
  critical: "bg-rose-50 text-rose-700",
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
};

const filterTasks = (view: string, tasks: Array<{ taskStatus: string }>) => {
  if (view === "active") {
    return tasks.filter((task) => task.taskStatus !== "completed" && task.taskStatus !== "abandoned");
  }
  if (view === "blocked") {
    return tasks.filter((task) => task.taskStatus === "blocked");
  }
  if (view === "completed") {
    return tasks.filter((task) => task.taskStatus === "completed");
  }
  return tasks;
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const view = searchParams.view ?? "all";

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view requests.
      </div>
    );
  }

  const requests = await prisma.request.findMany({
    where: { userId },
    include: {
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const items = requests.flatMap((request) =>
    request.tasks.map((task) => ({
      request,
      task,
    }))
  );

  const filtered = filterTasks(view, items.map((item) => item.task));

  const cards = items.filter((item) => filtered.includes(item.task));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Requests</p>
        <h1 className="font-display text-3xl text-slate-900">All requests</h1>
        <p className="text-sm text-slate-500">Track every request and its current status.</p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Blocked", value: "blocked" },
          { label: "Completed", value: "completed" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/requests?view=${tab.value}`}
            className={`rounded-full px-3 py-1 font-semibold uppercase tracking-[0.2em] ${
              view === tab.value
                ? "bg-slate-900 text-white"
                : "border border-[#d8d4cf] bg-white text-slate-500"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
            No requests match this view yet.
          </div>
        ) : (
          cards.map(({ request, task }) => (
            <div key={task.id} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 font-semibold ${urgencyTone[task.urgency] ?? "bg-slate-100 text-slate-600"}`}>
                  {task.urgency}
                </span>
                <span className={`rounded-full px-2 py-1 font-semibold ${statusTone[task.taskStatus] ?? "bg-slate-100 text-slate-600"}`}>
                  {task.taskStatus}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{task.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{task.summary}</p>
              <p className="mt-3 text-xs text-slate-400">
                {request.rawInput}
              </p>
              <div className="mt-4 flex justify-end text-xs text-slate-400">
                <Link className="flex items-center gap-1" href={`/request/${request.id}`}>
                  View details
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7" />
                    <path d="M9 7h8v8" />
                  </svg>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

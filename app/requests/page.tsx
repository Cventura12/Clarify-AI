import Link from "next/link";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { JsonValue } from "@prisma/client/runtime/library";

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

const formatDeadline = (dates: JsonValue) => {
  const items = asArray<{ date: string | null }>(dates);
  const first = items.find((item) => item.date);
  if (!first?.date) return "No deadline";
  const parsed = new Date(first.date);
  if (Number.isNaN(parsed.getTime())) return "No deadline";
  return parsed.toLocaleDateString();
};

const urgencyTone: Record<string, string> = {
  critical: "border border-rose-400/30 bg-rose-500/15 text-rose-300",
  high: "border border-orange-400/30 bg-orange-500/15 text-orange-300",
  medium: "border border-slate-400/30 bg-slate-400/10 text-slate-300",
  low: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
};

const isGenericTitle = (value: string) =>
  value.trim().toLowerCase().includes("clarify request details");

const deriveDisplayTitle = (title: string, summary: string, rawInput: string) => {
  if (title && !isGenericTitle(title)) return title;
  if (summary && !summary.toLowerCase().includes("need more detail")) {
    return summary.length > 90 ? `${summary.slice(0, 87).trim()}...` : summary;
  }
  return rawInput.length > 90 ? `${rawInput.slice(0, 87).trim()}...` : rawInput;
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
        <div className="flex items-center gap-3">
          <span className="h-0.5 w-8 rounded-full bg-[var(--accent)]" />
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">Requests</p>
        </div>
        <h1 className="font-display text-3xl text-[var(--text)]">All requests</h1>
        <p className="text-sm text-[var(--muted)]">Track every request and its current status.</p>
      </header>

      <div className="sticky top-2 z-10 rounded-xl py-1">
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
                  ? "bg-[var(--text)] text-[var(--surface)]"
                  : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)] shadow-[var(--shadow)]">
            No requests match this view yet.
          </div>
        ) : (
          cards.map(({ request, task }) => (
            <div key={task.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 font-semibold ${urgencyTone[task.urgency] ?? "bg-slate-100 text-slate-600"}`}>
                  {task.urgency}
                </span>
                <span className="text-[var(--kicker)]">{formatDeadline(task.dates)}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-[var(--text)]">
                {deriveDisplayTitle(task.title, task.summary, request.rawInput)}
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{task.summary}</p>
              <div className="mt-4 flex justify-end text-xs text-[var(--kicker)]">
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

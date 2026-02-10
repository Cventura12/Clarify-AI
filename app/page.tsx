import Link from "next/link";
import CommandBar from "@/components/CommandBar";
import DashboardMotion from "@/components/DashboardMotion";
import NotificationPanel from "@/components/NotificationPanel";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import RunStatsCard from "@/components/RunStatsCard";
import InsightsPanel from "@/components/InsightsPanel";
import { getFollowUpSuggestions, getScheduledFollowUps } from "@/lib/communications/followups";
import { buildPatternInsights } from "@/lib/context/suggestions";
import { prisma } from "@/lib/db";
import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

type CardItem = {
  id: string;
  title: string;
  urgency: string;
  meta: string;
  statusText: string;
  statusKind: "clock" | "check" | "alert";
  requestId?: string;
  taskStatus: string;
};

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

const formatDeadline = (dates: JsonValue) => {
  const items = asArray<{ date: string | null }>(dates);
  const first = items.find((item) => item.date);
  if (!first?.date) return "No deadline";
  const parsed = new Date(first.date);
  if (Number.isNaN(parsed.getTime())) return "No deadline";
  const diffDays = Math.ceil((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `${diffDays} days left`;
};

const urgencyStyles: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  high: "bg-red-50 text-red-700",
  medium: "bg-slate-100 text-slate-700",
  low: "bg-emerald-50 text-emerald-700",
};

const StatusGlyph = ({ kind }: { kind: "clock" | "check" | "alert" }) => {
  if (kind === "check") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-5" />
      </svg>
    );
  }
  if (kind === "alert") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
};

const buildCard = (task: Task, requestId: string): CardItem => {
  const statusText = typeof task.status === "object" && task.status
    ? (task.status as { what_is_pending?: string }).what_is_pending ?? task.summary
    : task.summary;
  const statusKind = task.taskStatus === "blocked" ? "alert" : task.taskStatus === "planned" ? "check" : "clock";

  return {
    id: task.id,
    title: task.title,
    urgency: task.urgency,
    meta: formatDeadline(task.dates),
    statusText: statusText ?? task.summary,
    statusKind,
    requestId,
    taskStatus: task.taskStatus,
  };
};

const fallbackCards: CardItem[] = [
  {
    id: "fallback-1",
    title: "Scholarship Follow-up: Gates Foundation",
    urgency: "high",
    meta: "2 days left",
    statusText: "Wait for response (Day 5/7)",
    statusKind: "clock",
    taskStatus: "interpreted",
  },
  {
    id: "fallback-2",
    title: "Job Application: Frontend Dev at Stripe",
    urgency: "medium",
    meta: "No deadline",
    statusText: "Review drafted cover letter",
    statusKind: "check",
    taskStatus: "planned",
  },
  {
    id: "fallback-3",
    title: "AP English Lit Assignment",
    urgency: "high",
    meta: "Due tomorrow",
    statusText: "Upload essay to portal",
    statusKind: "alert",
    taskStatus: "blocked",
  },
];

const filterCards = (cards: CardItem[], view: string) => {
  if (view === "active") {
    return cards.filter((card) => card.taskStatus !== "completed" && card.taskStatus !== "abandoned");
  }
  if (view === "blocked") {
    return cards.filter((card) => card.taskStatus === "blocked");
  }
  if (view === "history") {
    return cards.filter((card) => card.taskStatus === "completed" || card.taskStatus === "abandoned");
  }
  return cards;
};

export default async function DashboardPage() {
  const requests = await prisma.request.findMany({
    include: {
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const profile = await prisma.userProfile.findFirst();
  const preferences = await prisma.userPreference.findMany();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const planRuns = await prisma.planRun.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const tasks = requests.flatMap((request) =>
    request.tasks.map((task) => ({ task, requestId: request.id }))
  );

  const cards = tasks.length
    ? tasks.map(({ task, requestId }) => buildCard(task, requestId))
    : fallbackCards;

  const filteredCards = filterCards(cards, "all");
  const activeCount = cards.filter((card) => card.taskStatus !== "completed" && card.taskStatus !== "abandoned").length;
  const blockedCount = cards.filter((card) => card.taskStatus === "blocked").length;
  const scheduledLogs = await prisma.executionLog.findMany({
    where: {
      action: "Follow-up scheduled",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const scheduledItems = scheduledLogs
    .map((log) => {
      const detail = (log.detail as Record<string, unknown> | null) ?? {};
      const followUpAt = detail.followUpAt;
      if (typeof followUpAt !== "string") return null;
      const subject = typeof detail.subject === "string" ? detail.subject : undefined;
      return { id: log.id, followUpAt, subject };
    })
    .filter((item): item is { id: string; followUpAt: string; subject?: string } => Boolean(item));

  const suggestions = [
    ...getScheduledFollowUps(scheduledItems),
    ...getFollowUpSuggestions(tasks.map((item) => item.task)),
  ].slice(0, 4);
  const insights = buildPatternInsights(tasks.map((item) => item.task), profile, preferences);
  const runStats = planRuns.reduce(
    (acc, run) => {
      acc.totalRuns += 1;
      acc.executedSteps += run.executedCount;
      acc.skippedUnauthorized += run.skippedUnauthorized;
      acc.skippedDependencies += run.skippedDependencies;
      return acc;
    },
    { totalRuns: 0, executedSteps: 0, skippedUnauthorized: 0, skippedDependencies: 0 }
  );
  const lastRunAt = planRuns[0]?.createdAt ?? null;

  return (
    <DashboardMotion>
      <div className="space-y-12">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <header className="space-y-3" data-motion="hero">
              <div className="flex items-center gap-3">
                <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Command center</p>
              </div>
              <h1 className="font-display text-4xl text-slate-900">Good morning, Caleb.</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {activeCount || 3} active threads
                </span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  {blockedCount || 1} blocked item
                </span>
              </div>
            </header>

            <div data-motion="hero">
              <CommandBar />
            </div>
          </div>

          <div className="space-y-6">
            <NotificationPanel suggestions={suggestions} />
            <RunStatsCard
              totalRuns={runStats.totalRuns}
              executedSteps={runStats.executedSteps}
              skippedUnauthorized={runStats.skippedUnauthorized}
              skippedDependencies={runStats.skippedDependencies}
              lastRunAt={lastRunAt}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ProfileSummaryCard profile={profile} />
          <InsightsPanel insights={insights} />
        </section>

        <section className="space-y-5" data-motion="hero">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-[2px] w-8 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-300" />
                <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Threads</p>
              </div>
              <p className="text-lg font-semibold text-slate-900">Active requests</p>
            </div>
            <Link
              href="/requests"
              className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 hover:text-slate-700"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                data-motion="card"
                className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`rounded-full px-2 py-1 font-semibold capitalize ${urgencyStyles[card.urgency] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {card.urgency}
                  </span>
                  <span className="text-slate-400">{card.meta}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900">{card.title}</h3>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      card.statusKind === "alert"
                        ? "bg-rose-50 text-rose-600"
                        : card.statusKind === "check"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <StatusGlyph kind={card.statusKind} />
                  </span>
                  <span>{card.statusText}</span>
                </div>
                <div className="mt-4 flex justify-end text-xs text-slate-400">
                  {card.requestId ? (
                    <Link className="flex items-center gap-1" href={`/request/${card.requestId}`}>
                      View details
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7" />
                        <path d="M9 7h8v8" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1">View details</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardMotion>
  );
}

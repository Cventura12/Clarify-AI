import Link from "next/link";
import { redirect } from "next/navigation";
import CommandBar from "@/components/CommandBar";
import DashboardRequestList from "@/components/DashboardRequestList";
import DashboardMotion from "@/components/DashboardMotion";
import styles from "./dashboard.module.css";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";
import { getServerSession } from "next-auth";

type ThreadItem = {
  id: string;
  title: string;
  summary: string;
  urgency: "critical" | "high" | "medium" | "low";
  deadline: string;
  taskStatus: string;
  requestId?: string;
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
  if (diffDays <= 7) return `${diffDays}d left`;
  return parsed.toLocaleDateString();
};

const urgencyRank: Record<ThreadItem["urgency"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

type DashboardView = "all" | "active" | "blocked" | "completed";

const filterThreadsByView = (view: DashboardView, items: ThreadItem[]) => {
  if (view === "active") {
    return items.filter((item) => item.taskStatus !== "completed" && item.taskStatus !== "abandoned");
  }
  if (view === "blocked") {
    return items.filter((item) => item.taskStatus === "blocked");
  }
  if (view === "completed") {
    return items.filter((item) => item.taskStatus === "completed");
  }
  return items;
};

const buildThread = (task: Task, requestId: string): ThreadItem => {
  const isGenericTitle = task.title?.toLowerCase().includes("clarify request details");
  const isGenericSummary = task.summary?.toLowerCase().includes("need more detail");
  const title = task.title && !isGenericTitle ? task.title : task.summary || "Untitled request";
  const summary = !isGenericSummary ? task.summary?.trim() || "Awaiting next step" : "Awaiting next step";
  const compactSummary = summary.length > 120 ? `${summary.slice(0, 117).trim()}...` : summary;
  return {
    id: task.id,
    title,
    summary: compactSummary,
    urgency: (task.urgency ?? "low") as ThreadItem["urgency"],
    deadline: formatDeadline(task.dates),
    taskStatus: task.taskStatus,
    requestId,
  };
};

const dashboardViews: Array<{ label: string; value: DashboardView }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { view?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view your dashboard.
      </div>
    );
  }

  const selectedView = (searchParams?.view ?? "all") as DashboardView;
  const currentView: DashboardView = dashboardViews.some((view) => view.value === selectedView)
    ? selectedView
    : "all";

  const profile = await prisma.userProfile.findFirst({
    where: { userId },
  });
  if (!profile) {
    redirect("/onboarding");
  }

  const requests = await prisma.request.findMany({
    where: { userId },
    include: {
      tasks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const tasks = requests.flatMap((request) =>
    request.tasks.map((task) => ({ task, requestId: request.id, rawInput: request.rawInput }))
  );

  const threads = tasks.map(({ task, requestId, rawInput }) => {
    const thread = buildThread(task, requestId);
    if (thread.title.toLowerCase().includes("need more detail")) {
      return {
        ...thread,
        title: rawInput.length > 88 ? `${rawInput.slice(0, 85).trim()}...` : rawInput,
      };
    }
    return thread;
  });

  const hasThreads = threads.length > 0;
  const activeCount = threads.filter(
    (item) => item.taskStatus !== "completed" && item.taskStatus !== "abandoned"
  ).length;
  const blockedCount = threads.filter((item) => item.taskStatus === "blocked").length;

  const nextDeadlineTs = tasks
    .flatMap(({ task }) => asArray<{ date: string | null }>(task.dates as JsonValue))
    .map((item) => (item.date ? new Date(item.date) : null))
    .filter((item): item is Date => item instanceof Date && !Number.isNaN(item.getTime()))
    .map((item) => item.getTime())
    .sort((a, b) => a - b)[0];

  const nextDeadlineLabel = nextDeadlineTs
    ? new Date(nextDeadlineTs).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No deadline";

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.taskStatus === "blocked" && b.taskStatus !== "blocked") return -1;
    if (b.taskStatus === "blocked" && a.taskStatus !== "blocked") return 1;
    return urgencyRank[a.urgency] - urgencyRank[b.urgency];
  });

  const visibleThreads = filterThreadsByView(currentView, sortedThreads);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  if (!hasThreads) {
    return (
      <DashboardMotion>
        <div className={styles.dashboard}>
          <div className={`${styles.orb} ${styles.orbOne}`} data-motion="orb" />
          <div className={`${styles.orb} ${styles.orbTwo}`} data-motion="orb" />
          <section className={styles.topHeader}>
            <div className={styles.greetingBlock}>
              <p className={styles.greetingKicker}>Execution layer</p>
              <h1 className={styles.greetingTitle}>{greeting}, Caleb</h1>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryItem}>0 Active Tasks</span>
              <span className={styles.summaryDivider}>|</span>
              <span className={styles.summaryItem}>0 Blocked</span>
              <span className={styles.summaryDivider}>|</span>
              <span className={styles.summaryItem}>Next Deadline: {nextDeadlineLabel}</span>
            </div>
          </section>

          <section className={styles.commandCenter}>
            <div className={styles.commandCenterInner}>
              <CommandBar />
            </div>
          </section>

          <section className={styles.emptyState}>
            <p className={styles.emptyTitle}>Type your first request to get started.</p>
            <p className={styles.emptyBody}>
              Clarify will interpret your request, build a plan, then wait for your approval before execution.
            </p>
          </section>
        </div>
      </DashboardMotion>
    );
  }

  return (
    <DashboardMotion>
      <div className={styles.dashboard}>
        <div className={`${styles.orb} ${styles.orbOne}`} data-motion="orb" />
        <div className={`${styles.orb} ${styles.orbTwo}`} data-motion="orb" />
        <section className={styles.topHeader}>
          <div className={styles.greetingBlock}>
            <p className={styles.greetingKicker}>Execution layer</p>
            <h1 className={styles.greetingTitle}>{greeting}, Caleb</h1>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryItem}>{activeCount} Active Tasks</span>
            <span className={styles.summaryDivider}>|</span>
            <span className={styles.summaryItem}>{blockedCount} Blocked</span>
            <span className={styles.summaryDivider}>|</span>
            <span className={styles.summaryItem}>Next Deadline: {nextDeadlineLabel}</span>
          </div>
        </section>

        <section className={styles.commandCenter}>
          <div className={styles.commandCenterInner}>
            <CommandBar />
          </div>
        </section>

        <section className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <section data-motion="panel" className={styles.requestSection}>
              <div className={styles.requestHeader}>
                <div className={styles.requestHeaderLine}>
                  <span className={styles.requestHeaderAccent} />
                  <p className={styles.requestKicker}>Requests</p>
                </div>
                <h2 className={styles.requestTitle}>All requests</h2>
                <p className={styles.requestSubtitle}>Track every request and its current status.</p>
              </div>

              <div className={styles.requestFilterBar}>
                <div className={styles.requestFilters}>
                  {dashboardViews.map((view) => (
                    <Link
                      key={view.value}
                      href={view.value === "all" ? "/" : `/?view=${view.value}`}
                      className={`${styles.filterPill} ${
                        currentView === view.value ? styles.filterPillActive : styles.filterPillIdle
                      }`}
                    >
                      {view.label}
                    </Link>
                  ))}
                </div>
              </div>

              {visibleThreads.length === 0 ? (
                <div className={styles.requestEmpty}>No requests match this view yet.</div>
              ) : (
                <DashboardRequestList threads={visibleThreads} />
              )}
            </section>
          </div>
        </section>
      </div>
    </DashboardMotion>
  );
}

import Link from "next/link";
import CommandBar from "@/components/CommandBar";
import DashboardMotion from "@/components/DashboardMotion";
import NotificationPanel from "@/components/NotificationPanel";
import ProfileSummaryCard from "@/components/ProfileSummaryCard";
import RunStatsCard from "@/components/RunStatsCard";
import InsightsPanel from "@/components/InsightsPanel";
import styles from "./dashboard.module.css";
import { getFollowUpSuggestions, getScheduledFollowUps } from "@/lib/communications/followups";
import { buildPatternInsights } from "@/lib/context/suggestions";
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

const buildThread = (task: Task, requestId: string): ThreadItem => {
  const title =
    task.title && task.title.toLowerCase() !== "clarify request details"
      ? task.title
      : task.summary ?? task.title;
  return {
    id: task.id,
    title: title ?? "Untitled request",
    summary: task.summary ?? "Awaiting next step",
    urgency: (task.urgency ?? "low") as ThreadItem["urgency"],
    deadline: formatDeadline(task.dates),
    taskStatus: task.taskStatus,
    requestId,
  };
};

const fallbackThreads: ThreadItem[] = [
  {
    id: "fallback-1",
    title: "NYU Tandon ED2 — Verify application portal",
    summary: "Planned follow-up",
    urgency: "critical",
    deadline: "3d left",
    taskStatus: "planned",
  },
  {
    id: "fallback-2",
    title: "Recommender follow-up — Confirm letter received",
    summary: "Draft ready",
    urgency: "critical",
    deadline: "3d left",
    taskStatus: "ready",
  },
  {
    id: "fallback-3",
    title: "AP Computer Science — Assignment submission",
    summary: "Interpreted",
    urgency: "high",
    deadline: "Feb 14",
    taskStatus: "interpreted",
  },
  {
    id: "fallback-4",
    title: "FAFSA verification — Check completion status",
    summary: "Interpreted",
    urgency: "high",
    deadline: "Feb 20",
    taskStatus: "interpreted",
  },
  {
    id: "fallback-5",
    title: "UIUC vs NYU — Compare financial aid packages",
    summary: "Blocked",
    urgency: "medium",
    deadline: "Feb 28",
    taskStatus: "blocked",
  },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view your dashboard.
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
  const profile = await prisma.userProfile.findFirst({
    where: { userId },
  });
  const preferences = await prisma.userPreference.findMany({
    where: { userId },
  });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const planRuns = await prisma.planRun.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      plan: { task: { request: { userId } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const tasks = requests.flatMap((request) =>
    request.tasks.map((task) => ({ task, requestId: request.id }))
  );

  const threads = tasks.length
    ? tasks.map(({ task, requestId }) => buildThread(task, requestId))
    : fallbackThreads;

  const activeCount = threads.filter((item) => item.taskStatus !== "completed" && item.taskStatus !== "abandoned").length;
  const blockedCount = threads.filter((item) => item.taskStatus === "blocked").length;
  const criticalCount = threads.filter((item) => item.urgency === "critical").length;
  const highCount = threads.filter((item) => item.urgency === "high").length;

  const sortedThreads = [...threads].sort((a, b) => {
    if (a.taskStatus === "blocked" && b.taskStatus !== "blocked") return -1;
    if (b.taskStatus === "blocked" && a.taskStatus !== "blocked") return 1;
    return urgencyRank[a.urgency] - urgencyRank[b.urgency];
  });

  const attentionItems = sortedThreads.filter(
    (item) => item.urgency === "critical" || item.urgency === "high" || item.taskStatus === "blocked"
  ).slice(0, 2);
  const activeThreads = sortedThreads.filter((item) => !attentionItems.includes(item)).slice(0, 4);
  const scheduledLogs = await prisma.executionLog.findMany({
    where: {
      action: "Follow-up scheduled",
      step: {
        plan: {
          task: {
            request: {
              userId,
            },
          },
        },
      },
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
    .filter(
      (item): item is { id: string; followUpAt: string; subject: string | undefined } =>
        item !== null
    );

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
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardMotion>
      <div className={styles.dashboard}>
        <div className={`${styles.orb} ${styles.orbOne}`} data-motion="orb" />
        <div className={`${styles.orb} ${styles.orbTwo}`} data-motion="orb" />
        <section className={styles.headerRow}>
          <div className={styles.greetingBlock}>
            <p className={styles.greetingKicker}>Execution layer</p>
            <h1 className={styles.greetingTitle}>
              {greeting}, Caleb
            </h1>
            <div className={styles.statPills}>
              <span className={`${styles.statPill} ${styles.statCritical}`}>{criticalCount} critical</span>
              <span className={`${styles.statPill} ${styles.statHigh}`}>{highCount} high</span>
              <span className={`${styles.statPill} ${styles.statBlocked}`}>{blockedCount} blocked</span>
              <span className={`${styles.statPill} ${styles.statActive}`}>{activeCount} active</span>
            </div>
          </div>
        </section>

        <section className={styles.commandRow}>
          <CommandBar />
        </section>

        <section className={styles.mainGrid}>
          <div className={styles.leftColumn}>
            <div className={styles.sectionHeaderRow}>
              <p className={styles.sectionLabel}>Needs attention now</p>
              <Link className={styles.sectionLink} href="/requests">View all</Link>
            </div>
            <div className={styles.threadList}>
              {attentionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.requestId ? `/request/${item.requestId}` : "/requests"}
                  className={`${styles.threadItem} ${styles[`thread${item.urgency}`]}`}
                >
                  <div className={styles.threadContent}>
                    <p className={styles.threadTitle}>{item.title}</p>
                    <p className={styles.threadMeta}>
                      <span className={styles.threadStatus}>{item.taskStatus}</span>
                      <span className={styles.threadDot}>•</span>
                      <span className={styles.threadSummary}>{item.summary}</span>
                    </p>
                  </div>
                  <div className={styles.threadBadges}>
                    <span className={styles.deadlineBadge}>{item.deadline}</span>
                    <span className={`${styles.urgencyBadge} ${styles[`badge${item.urgency}`]}`}>{item.urgency}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className={styles.sectionHeaderRow}>
              <p className={styles.sectionLabel}>Active threads</p>
            </div>
            <div className={styles.threadList}>
              {activeThreads.map((item) => (
                <Link
                  key={item.id}
                  href={item.requestId ? `/request/${item.requestId}` : "/requests"}
                  className={`${styles.threadItem} ${styles[`thread${item.urgency}`]}`}
                >
                  <div className={styles.threadContent}>
                    <p className={styles.threadTitle}>{item.title}</p>
                    <p className={styles.threadMeta}>
                      <span className={styles.threadStatus}>{item.taskStatus}</span>
                      <span className={styles.threadDot}>•</span>
                      <span className={styles.threadSummary}>{item.summary}</span>
                    </p>
                  </div>
                  <div className={styles.threadBadges}>
                    <span className={styles.deadlineBadge}>{item.deadline}</span>
                    <span className={`${styles.urgencyBadge} ${styles[`badge${item.urgency}`]}`}>{item.urgency}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <NotificationPanel suggestions={suggestions} />
            <RunStatsCard
              totalRuns={runStats.totalRuns}
              executedSteps={runStats.executedSteps}
              skippedUnauthorized={runStats.skippedUnauthorized}
              skippedDependencies={runStats.skippedDependencies}
              lastRunAt={lastRunAt}
            />
            <ProfileSummaryCard profile={profile} />
            <InsightsPanel insights={insights} />
          </div>
        </section>
      </div>
    </DashboardMotion>
  );
}

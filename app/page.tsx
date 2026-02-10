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
  critical: styles.urgencyCritical,
  high: styles.urgencyHigh,
  medium: styles.urgencyMedium,
  low: styles.urgencyLow,
};

const StatusGlyph = ({ kind }: { kind: "clock" | "check" | "alert" }) => {
  if (kind === "check") {
    return (
      <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12l3 3 5-5" />
      </svg>
    );
  }
  if (kind === "alert") {
    return (
      <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
};

const buildCard = (task: Task, requestId: string): CardItem => {
  const pending =
    typeof task.status === "object" && task.status
      ? (task.status as { what_is_pending?: string }).what_is_pending
      : undefined;
  const statusText = pending ?? task.summary ?? "Awaiting next step";
  const title =
    task.title && task.title.toLowerCase() !== "clarify request details"
      ? task.title
      : task.summary ?? task.title;
  const statusKind = task.taskStatus === "blocked" ? "alert" : task.taskStatus === "planned" ? "check" : "clock";

  return {
    id: task.id,
    title: title ?? "Untitled request",
    urgency: task.urgency ?? "low",
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

  const cards = tasks.length
    ? tasks.map(({ task, requestId }) => buildCard(task, requestId))
    : fallbackCards;

  const filteredCards = filterCards(cards, "all");
  const activeCount = cards.filter((card) => card.taskStatus !== "completed" && card.taskStatus !== "abandoned").length;
  const blockedCount = cards.filter((card) => card.taskStatus === "blocked").length;
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

  return (
    <DashboardMotion>
      <div className={styles.dashboard}>
        <div className={`${styles.orb} ${styles.orbOne}`} data-motion="orb" />
        <div className={`${styles.orb} ${styles.orbTwo}`} data-motion="orb" />
        <section className={styles.heroGrid}>
          <div className={styles.heroStack}>
            <header className={styles.heroHeader}>
              <div className={styles.heroLabel} data-motion="hero-kicker">
                <span className={styles.gradientLine} />
                <p className={styles.heroKicker}>Command center</p>
              </div>
              <h1 className={styles.heroTitle} data-motion="hero-title">Good morning, Caleb.</h1>
              <div className={styles.pillRow} data-motion="hero-pills">
                <span className={styles.pill}>
                  {activeCount || 3} active threads
                </span>
                <span className={styles.pill}>
                  {blockedCount || 1} blocked item
                </span>
              </div>
            </header>

            <div data-motion="hero-command">
              <CommandBar />
            </div>
          </div>

          <div className={styles.heroSide}>
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

        <section className={styles.secondaryGrid}>
          <ProfileSummaryCard profile={profile} />
          <InsightsPanel insights={insights} />
        </section>

        <section className={styles.threadSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <div className={styles.sectionLabel}>
                <span className={styles.gradientLineWarm} />
                <p className={styles.sectionKicker}>Threads</p>
              </div>
              <p className={styles.sectionHeadline}>Active requests</p>
            </div>
            <Link
              href="/requests"
              className={styles.sectionLink}
            >
              View all
            </Link>
          </div>

          <div className={styles.cardsGrid}>
            {filteredCards.map((card) => (
              <div
                key={card.id}
                data-motion="card"
                className={styles.taskCard}
              >
                <div className={styles.cardMeta}>
                  <span
                    className={`${styles.urgencyBadge} ${urgencyStyles[card.urgency] ?? styles.urgencyMedium}`}
                  >
                    {card.urgency}
                  </span>
                  <span className={styles.cardMetaText}>{card.meta}</span>
                </div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <div className={styles.cardStatus}>
                  <span
                    className={`${styles.statusIcon} ${
                      card.statusKind === "alert"
                        ? styles.statusAlert
                        : card.statusKind === "check"
                        ? styles.statusCheck
                        : styles.statusClock
                    }`}
                  >
                    <StatusGlyph kind={card.statusKind} />
                  </span>
                  <span>{card.statusText}</span>
                </div>
                <div className={styles.cardFooter}>
                  {card.requestId ? (
                    <Link className={styles.cardLink} href={`/request/${card.requestId}`}>
                      View details
                      <svg viewBox="0 0 24 24" className={styles.cardLinkIcon} fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17L17 7" />
                        <path d="M9 7h8v8" />
                      </svg>
                    </Link>
                  ) : (
                    <span className={styles.cardLink}>View details</span>
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

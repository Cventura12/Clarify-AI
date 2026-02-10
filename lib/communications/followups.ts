import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

export type ScheduledFollowUp = {
  id: string;
  subject?: string | null;
  followUpAt: string;
};

export type FollowUpSuggestion = {
  id: string;
  title: string;
  detail: string;
  dueLabel: string;
  type: "follow_up" | "deadline" | "blocker" | "scheduled";
};

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

const daysUntil = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export const getFollowUpSuggestions = (tasks: Task[]) => {
  const suggestions: FollowUpSuggestion[] = [];

  tasks.forEach((task) => {
    const dates = asArray<{ date: string | null; description?: string }>(task.dates);
    const nextDate = dates.find((item) => item.date);

    if (nextDate?.date) {
      const diff = daysUntil(nextDate.date);
      if (diff !== null && diff <= 3) {
        suggestions.push({
          id: `${task.id}-deadline`,
          title: task.title,
          detail: nextDate.description ?? "Deadline approaching",
          dueLabel: diff <= 0 ? "Due today" : `Due in ${diff} day${diff === 1 ? "" : "s"}`,
          type: "deadline",
        });
      }
    }

    if (task.taskStatus === "blocked") {
      suggestions.push({
        id: `${task.id}-blocked`,
        title: task.title,
        detail: "Blocked task needs attention",
        dueLabel: "Blocked",
        type: "blocker",
      });
    }

    if (task.domain === "follow_up" || task.domain === "job_application" || task.domain === "scholarship") {
      suggestions.push({
        id: `${task.id}-followup`,
        title: task.title,
        detail: "Consider sending a follow-up",
        dueLabel: "Follow-up",
        type: "follow_up",
      });
    }
  });

  return suggestions.slice(0, 3);
};

export const getScheduledFollowUps = (items: ScheduledFollowUp[]) => {
  const suggestions: FollowUpSuggestion[] = [];

  items.forEach((item) => {
    const diff = daysUntil(item.followUpAt);
    if (diff === null) return;
    if (diff < -1) return;
    if (diff > 7) return;

    suggestions.push({
      id: `${item.id}-scheduled`,
      title: item.subject ?? "Scheduled follow-up",
      detail: "Follow-up scheduled",
      dueLabel: diff <= 0 ? "Today" : `In ${diff} day${diff === 1 ? "" : "s"}`,
      type: "scheduled",
    });
  });

  return suggestions;
};

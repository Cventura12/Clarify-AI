import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

export type Reminder = {
  id: string;
  title: string;
  dueDate: string;
  label: string;
};

export type EscalatedReminder = Reminder & {
  severity: "critical" | "high" | "medium" | "low";
  daysUntil: number;
};

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

export const buildReminders = (tasks: Task[]) => {
  const reminders: Reminder[] = [];
  tasks.forEach((task) => {
    const dates = asArray<{ date: string | null; description?: string }>(task.dates);
    dates.forEach((item, index) => {
      if (!item.date) return;
      reminders.push({
        id: `${task.id}-${index}`,
        title: task.title,
        dueDate: item.date,
        label: item.description ?? "Deadline",
      });
    });
  });

  return reminders.slice(0, 10);
};

const daysUntil = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const severityFor = (diff: number): EscalatedReminder["severity"] => {
  if (diff <= 0) return "critical";
  if (diff <= 2) return "high";
  if (diff <= 7) return "medium";
  return "low";
};

export const buildEscalatingReminders = (tasks: Task[]) => {
  const reminders: EscalatedReminder[] = [];

  tasks.forEach((task) => {
    const dates = asArray<{ date: string | null; description?: string }>(task.dates);
    dates.forEach((item, index) => {
      if (!item.date) return;
      const diff = daysUntil(item.date);
      if (diff === null) return;
      reminders.push({
        id: `${task.id}-${index}`,
        title: task.title,
        dueDate: item.date,
        label: item.description ?? "Deadline",
        severity: severityFor(diff),
        daysUntil: diff,
      });
    });
  });

  return reminders.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 20);
};

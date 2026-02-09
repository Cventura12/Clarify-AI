export type Reminder = {
  scheduledAt: string;
  message: string;
};

export function scheduleReminders(targetIso: string): Reminder[] {
  const target = new Date(targetIso);
  const reminders = [
    { offsetDays: 7, label: "One week before" },
    { offsetDays: 2, label: "Two days before" },
    { offsetDays: 0, label: "Due today" }
  ];

  return reminders.map((reminder) => {
    const scheduled = new Date(target.getTime() - reminder.offsetDays * 24 * 60 * 60 * 1000);
    return {
      scheduledAt: scheduled.toISOString(),
      message: `${reminder.label} - deadline approaching.`
    };
  });
}

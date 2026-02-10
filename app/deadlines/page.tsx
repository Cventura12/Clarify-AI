import { prisma } from "@/lib/db";
import { buildEscalatingReminders } from "@/lib/deadlines/reminders";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const severityStyle: Record<string, string> = {
  critical: "bg-red-50 text-red-700",
  high: "bg-amber-50 text-amber-700",
  medium: "bg-sky-50 text-sky-700",
  low: "bg-slate-100 text-slate-600",
};

const formatBucket = (daysUntil: number) => {
  if (daysUntil < 0) return "Overdue";
  if (daysUntil === 0) return "Today";
  if (daysUntil <= 3) return "Next 3 days";
  if (daysUntil <= 7) return "This week";
  return "Later";
};

export default async function DeadlinesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
        Please sign in to view deadlines.
      </div>
    );
  }

  const tasks = await prisma.task.findMany({
    where: { request: { userId } },
    orderBy: { createdAt: "desc" },
  });
  const reminders = buildEscalatingReminders(tasks);
  const buckets = reminders.reduce<Record<string, typeof reminders>>((acc, reminder) => {
    const key = formatBucket(reminder.daysUntil);
    acc[key] = acc[key] ? [...acc[key], reminder] : [reminder];
    return acc;
  }, {});

  const bucketOrder = ["Overdue", "Today", "Next 3 days", "This week", "Later"];

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Deadlines</p>
        <h1 className="font-display text-3xl text-slate-900">Calendar & reminders</h1>
        <p className="text-sm text-slate-500">Escalating reminders based on due dates.</p>
      </header>

      {reminders.length === 0 ? (
        <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 text-sm text-slate-500 shadow-soft">
          No deadlines yet. Add dates to tasks to populate reminders.
        </div>
      ) : (
        <div className="space-y-6">
          {bucketOrder.map((bucket) => {
            const items = buckets[bucket];
            if (!items || items.length === 0) return null;
            return (
              <div key={bucket} className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{bucket}</p>
                  <span className="text-xs text-slate-400">{items.length} items</span>
                </div>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-[#ebe8e3] bg-[#fbfaf8] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <span className={`rounded-full px-2 py-1 text-xs ${severityStyle[item.severity]}`}>
                          {item.severity}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{item.label}</span>
                        <span>Due {new Date(item.dueDate).toLocaleDateString()}</span>
                        <span>
                          {item.daysUntil < 0
                            ? `${Math.abs(item.daysUntil)} day${Math.abs(item.daysUntil) === 1 ? "" : "s"} overdue`
                            : `${item.daysUntil} day${item.daysUntil === 1 ? "" : "s"} left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import AmbiguityPrompt from "@/components/AmbiguityPrompt";
import PlanView from "@/components/PlanView";
import StatusBadge from "@/components/StatusBadge";
import type { Plan, Step, Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function TaskCard({
  task,
  plan,
  variant = "full",
}: {
  task: Task;
  plan?: (Plan & { steps: Step[] }) | null;
  variant?: "full" | "compact";
}) {
  const ambiguities = asArray<{
    question: string;
    why_it_matters: string;
    default_assumption?: string | null;
  }>(task.ambiguities);

  const hiddenDependencies = asArray<{ insight: string; risk_if_ignored: string }>(
    task.hiddenDependencies
  );

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <StatusBadge label={task.urgency} tone={task.urgency} />
          <span className="text-[10px] uppercase tracking-[0.2em]">{task.domain}</span>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-slate-900">{task.title}</h3>
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.summary}</p>
      </div>
    );
  }

  return (
    <div
      data-motion="card"
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-4 shadow-[var(--shadow)] backdrop-blur"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
          <p className="text-sm text-slate-500 line-clamp-2">{task.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge label={task.domain} tone="neutral" />
          <StatusBadge label={task.urgency} tone={task.urgency} />
          <StatusBadge label={task.complexity} tone="neutral" />
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-400">
        Status: <span className="text-slate-600">{task.taskStatus}</span>
      </div>

      {ambiguities.length > 0 ? (
        <div className="mt-3">
          <AmbiguityPrompt ambiguities={ambiguities} />
        </div>
      ) : null}

      {hiddenDependencies.length > 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Hidden dependencies</p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            {hiddenDependencies.map((dependency, index) => (
              <li key={`${task.id}-hidden-${index}`}>{dependency.insight}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {plan ? (
        <div className="mt-3">
          <PlanView plan={plan} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Plan, Step } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

const statusTone: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  ready: "bg-sky-100 text-sky-700",
  authorized: "bg-amber-100 text-amber-700",
  executing: "bg-purple-100 text-purple-700",
  done: "bg-emerald-100 text-emerald-700",
  blocked: "bg-red-100 text-red-700",
  skipped: "bg-slate-200 text-slate-600",
};

const delegationLabel: Record<string, string> = {
  can_draft: "Clarify can draft",
  can_remind: "Clarify can remind",
  can_track: "Clarify can track",
  user_only: "Manual by you",
};

export default function PlanView({ plan }: { plan: Plan & { steps: Step[] } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const riskFlags = asArray<{ risk: string; severity: string; mitigation: string }>(plan.riskFlags);
  const nextAction = plan.nextAction as { step_number: number; action: string; why_first: string } | null;
  const delegationSummary = (plan.delegationSummary as {
    can_draft?: number;
    can_remind?: number;
    can_track?: number;
    user_only?: number;
  } | null) ?? { can_draft: 0, can_remind: 0, can_track: 0, user_only: 0 };
  const clarifyHandled =
    (delegationSummary.can_draft ?? 0) +
    (delegationSummary.can_remind ?? 0) +
    (delegationSummary.can_track ?? 0);
  const manualHandled = delegationSummary.user_only ?? 0;
  const authorizedCount = plan.steps.filter((step) => step.status === "authorized").length;
  const canRun = authorizedCount > 0;

  const authorizeStep = (stepId: string) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/steps/${stepId}/authorize`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to approve step.");
        return;
      }
      router.refresh();
    });
  };

  const rejectStep = (stepId: string) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/steps/${stepId}/reject`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to reject step.");
        return;
      }
      router.refresh();
    });
  };

  const executeStep = (stepId: string) => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/steps/${stepId}/execute`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to execute step.");
        return;
      }
      router.refresh();
    });
  };

  const runPlan = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/plans/${plan.id}/execute`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.reason ?? data?.error?.message ?? "Failed to execute plan.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
          <p className="text-sm text-slate-600">
            {plan.totalSteps} steps - {plan.estimatedTotalEffort}
          </p>
        </div>
        <button
          type="button"
          onClick={runPlan}
          disabled={isPending || !canRun}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            canRun
              ? "border border-[#d8d4cf] bg-white text-slate-600 hover:border-slate-300"
              : "border border-[#e6e4e1] bg-slate-50 text-slate-400"
          }`}
        >
          {isPending ? "Running" : `Run ${authorizedCount} approved`}
        </button>
        {plan.deadline ? (
          <p className="text-xs text-slate-400">
            Deadline: {new Date(plan.deadline).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
          Clarify-handled: {clarifyHandled}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-700">
          Manual: {manualHandled}
        </span>
      </div>

      {nextAction ? (
        <div className="mt-3 rounded-lg border border-[#ebe8e3] bg-white p-3 text-sm text-slate-600">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next action</p>
          <p className="mt-1">
            Step {nextAction.step_number}: {nextAction.action}
          </p>
          <p className="mt-1 text-xs text-slate-400">{nextAction.why_first}</p>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-xs text-red-500">{error}</p> : null}

      <ol className="mt-4 space-y-3">
        {plan.steps.map((step) => (
          <li key={step.id} className="rounded-lg border border-[#ebe8e3] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                Step {step.stepNumber}: {step.action}
              </p>
              <span className="text-xs text-slate-400">{step.effort}</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{step.detail}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                  {delegationLabel[step.delegation] ?? step.delegation}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${statusTone[step.status] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {step.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {step.status === "pending" || step.status === "ready" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => authorizeStep(step.id)}
                      disabled={isPending}
                      className="rounded-full border border-[#d8d4cf] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectStep(step.id)}
                      disabled={isPending}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {step.status === "authorized" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => executeStep(step.id)}
                      disabled={isPending}
                      className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
                    >
                      Execute
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectStep(step.id)}
                      disabled={isPending}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {step.status === "done" && step.outcome ? (
                  <span className="text-xs text-slate-500">{step.outcome}</span>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {riskFlags.length > 0 ? (
        <div className="mt-4 rounded-lg border border-[#ebe8e3] bg-white p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk flags</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {riskFlags.map((risk, index) => (
              <li key={`${plan.id}-risk-${index}`}>
                {risk.risk} ({risk.severity})
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

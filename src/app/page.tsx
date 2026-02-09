"use client";

import { useState } from "react";
import Link from "next/link";
import { useInputHistory } from "@/hooks/useInputHistory";
import { useContextMemory } from "@/hooks/useContextMemory";
import { buildSuggestions } from "@/lib/context/suggestions";

const pipeline = [
  {
    title: "Interpret",
    description: "Turn natural language into structured tasks and intent."
  },
  {
    title: "Plan",
    description: "Break work into executable steps with dependencies and priority."
  },
  {
    title: "Execute",
    description: "Draft, fill, and schedule actions with approval in the loop."
  }
];

type InterpretResult = {
  intent: string;
  tasks: Array<{
    title: string;
    description?: string;
    urgency?: number;
  }>;
  requiresClarification: boolean;
  questions: Array<{ id: string; question: string }>;
  confidence: number;
};

type PlanStep = {
  title: string;
  order: number;
  dependsOn?: number[];
};

type PlanResult = {
  taskTitle: string;
  priorityScore: number;
  steps: PlanStep[];
};

type ExecuteAction = {
  id: string;
  title: string;
  type: string;
  payload?: Record<string, unknown>;
  requiresApproval: boolean;
};

type ExecuteResult = {
  ok: boolean;
  message: string;
  actionId: string;
  draft?: { subject: string; body: string };
  followUp?: { suggestedAt: string; reason: string };
  notifications?: string[];
  document?: { title: string; body: string };
  storedFile?: { id: string; name: string; url: string };
  formFields?: Array<{ name: string; value: string }>;
  reminders?: Array<{ scheduledAt: string; message: string }>;
};

type ExecuteResponse = {
  stepTitle: string;
  actions: ExecuteAction[];
};

export default function HomePage() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [interpretResult, setInterpretResult] = useState<InterpretResult | null>(
    null
  );
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [executeActions, setExecuteActions] = useState<ExecuteAction[]>([]);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [approvalState, setApprovalState] = useState<
    "idle" | "pending" | "approved" | "rejected"
  >("idle");
  const { history, addEntry } = useInputHistory(5);
  const { entries: contextEntries } = useContextMemory();
  const suggestions = buildSuggestions(contextEntries);

  const canRun = input.trim().length > 0 && status !== "running";

  async function runPipeline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    setStatus("running");
    setError(null);
    setInterpretResult(null);
    setPlanResult(null);
    setExecuteActions([]);
    setExecuteResult(null);
    setNotifications([]);
    setApprovalState("idle");
    addEntry(input.trim());

    try {
      const interpretResponse = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const interpretJson = await interpretResponse.json();
      if (!interpretResponse.ok) {
        throw new Error(interpretJson?.error || "Interpret failed");
      }
      setInterpretResult(interpretJson);

      const taskTitle = interpretJson?.tasks?.[0]?.title || input.trim();
      const planResponse = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle })
      });
      const planJson = await planResponse.json();
      if (!planResponse.ok) {
        throw new Error(planJson?.error || "Plan failed");
      }
      setPlanResult(planJson);

      const stepTitle = planJson?.steps?.[0]?.title || `Execute ${taskTitle}`;
      const executeResponse = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepTitle })
      });
      const executeJson: ExecuteResponse = await executeResponse.json();
      if (!executeResponse.ok) {
        throw new Error((executeJson as any)?.error || "Execute failed");
      }
      setExecuteActions(executeJson.actions || []);
      setApprovalState("pending");

      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Pipeline failed";
      setError(message);
      setStatus("error");
    }
  }

  async function approveAction(action: ExecuteAction) {
    setApprovalState("approved");
    const response = await fetch("/api/execute", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json?.error || "Execution failed");
      setApprovalState("rejected");
      return;
    }
    setExecuteResult(json.result);
    setNotifications(json.result?.notifications ?? []);
  }

  function rejectAction() {
    setApprovalState("rejected");
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-ink/10 bg-surface/70 p-8 shadow-[0_20px_80px_rgba(12,15,20,0.15)] backdrop-blur fade-in">
          <p className="text-sm uppercase tracking-[0.3em] text-ember">Clarify</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            Your personal execution layer for life admin.
          </h1>
          <p className="mt-6 text-lg text-muted">
            Interpret, plan, and execute complex tasks with real automation and
            human approval at every step.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pipeline.map((stage) => (
              <div
                key={stage.title}
                className="rounded-2xl border border-ink/10 bg-haze p-5"
              >
                <h2 className="text-lg font-semibold">{stage.title}</h2>
                <p className="mt-2 text-sm text-muted">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
              href="#command"
            >
              Start a workflow
            </a>
            <a
              className="rounded-full border border-ink/20 px-6 py-3 text-sm font-semibold text-ink"
              href="/docs/12-week-plan.md"
            >
              View the plan
            </a>
          </div>
        </div>

        <form
          id="command"
          className="mt-12 rounded-2xl border border-ink/10 bg-surface/70 p-6"
          onSubmit={runPipeline}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Command Bar</h3>
            <div className="flex gap-3 text-sm">
              <Link className="text-ember" href="/login">
                Login
              </Link>
              <Link className="text-ember" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            Try: "Follow up on my internship application and set reminders"
          </p>
          <textarea
            className="mt-4 w-full resize-none rounded-2xl border border-ink/10 bg-surface/80 p-4 text-sm text-ink shadow-inner"
            rows={3}
            placeholder="Type a request..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canRun}
              type="submit"
            >
              Run pipeline
            </button>
            <span className="text-sm text-muted/80">
              Status: {status === "idle" ? "ready" : status}
            </span>
          </div>
          {status === "running" ? (
            <p className="mt-3 text-sm text-muted/80">
              Working through interpret, plan, and execute...
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </form>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-5">
            <h3 className="text-lg font-semibold">Interpret Output</h3>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-ink/5 p-3 text-xs text-muted">
              {interpretResult
                ? JSON.stringify(interpretResult, null, 2)
                : "No output yet."}
            </pre>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-5">
            <h3 className="text-lg font-semibold">Plan Output</h3>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-ink/5 p-3 text-xs text-muted">
              {planResult ? JSON.stringify(planResult, null, 2) : "No output yet."}
            </pre>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-5">
            <h3 className="text-lg font-semibold">Execute Output</h3>
            <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-ink/5 p-3 text-xs text-muted">
              {executeActions.length
                ? JSON.stringify(executeActions, null, 2)
                : "No output yet."}
            </pre>
          </div>
        </section>

        {executeActions.length ? (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-lg font-semibold text-emerald-900">Action Approval</h3>
            <div className="mt-3 grid gap-3 text-sm text-emerald-900">
              {executeActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-emerald-200 bg-surface p-4"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
                    {action.type}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{action.title}</p>
                  <p className="mt-2 text-xs text-emerald-700">
                    Requires approval: {action.requiresApproval ? "Yes" : "No"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                      onClick={() => approveAction(action)}
                      disabled={approvalState === "approved"}
                    >
                      Approve
                    </button>
                    <button
                      className="rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-900"
                      onClick={rejectAction}
                      disabled={approvalState === "rejected"}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {executeResult?.document ? (
          <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <h3 className="text-lg font-semibold text-sky-900">Document Preview</h3>
            <p className="mt-2 text-sm font-semibold text-sky-900">
              {executeResult.document.title}
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface p-3 text-sm text-sky-900">
              {executeResult.document.body}
            </pre>
            {executeResult.storedFile ? (
              <p className="mt-3 text-xs text-sky-800">
                Stored file: {executeResult.storedFile.name}
              </p>
            ) : null}
          </section>
        ) : null}

        {executeResult?.formFields ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-semibold text-amber-900">Form Autofill</h3>
            <ul className="mt-3 text-sm text-amber-900">
              {executeResult.formFields.map((field) => (
                <li key={field.name}>
                  {field.name}: {field.value || ""}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {executeResult?.reminders ? (
          <section className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <h3 className="text-lg font-semibold text-teal-900">Scheduled Reminders</h3>
            <ul className="mt-3 text-sm text-teal-900">
              {executeResult.reminders.map((reminder, index) => (
                <li key={`${reminder.scheduledAt}-${index}`}>
                  {new Date(reminder.scheduledAt).toLocaleString()} -
                  {" "}{reminder.message}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {executeResult?.draft ? (
          <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <h3 className="text-lg font-semibold text-indigo-900">Draft Preview</h3>
            <p className="mt-2 text-sm font-semibold text-indigo-900">
              Subject: {executeResult.draft.subject}
            </p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface p-3 text-sm text-indigo-900">
              {executeResult.draft.body}
            </pre>
            {executeResult.followUp ? (
              <p className="mt-3 text-xs text-indigo-800">
                Follow-up suggested: {new Date(
                  executeResult.followUp.suggestedAt
                ).toLocaleString()} ({executeResult.followUp.reason})
              </p>
            ) : null}
          </section>
        ) : null}

        {notifications.length ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-surface/80 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
            <ul className="mt-3 text-sm text-slate-800">
              {notifications.map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {executeResult ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold text-slate-900">Execution Result</h3>
            <p className="mt-2 text-sm text-slate-800">{executeResult.message}</p>
          </section>
        ) : null}

        {interpretResult?.requiresClarification ? (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-lg font-semibold text-amber-900">
              Clarifications needed
            </h3>
            <ul className="mt-3 text-sm text-amber-900">
              {interpretResult.questions.map((question) => (
                <li key={question.id}>{question.question}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Context Memory</h3>
            {contextEntries.length ? (
              <ul className="mt-2 text-sm text-muted">
                {contextEntries.map((entry) => (
                  <li key={entry.id}>
                    <span className="font-semibold">{entry.label}:</span> {entry.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">No context saved yet.</p>
            )}
            <p className="mt-3 text-sm text-muted">
              Add context in{" "}
              <Link className="text-ember" href="/onboarding">
                onboarding
              </Link>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Smart Suggestions</h3>
            <ul className="mt-2 text-sm text-muted">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <span className="font-semibold">{suggestion.text}</span>
                  <p className="text-xs text-muted/80">{suggestion.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Pipeline Status</h3>
            <p className="mt-2 text-sm text-muted">
              The API routes now stub interpret, plan, and execute using the
              modules in <code>src/lib</code>.
            </p>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Recent Inputs</h3>
            <div className="mt-2 text-sm text-muted">
              {history.length ? (
                <ul className="grid gap-2">
                  {history.map((item, index) => (
                    <li key={`${item.createdAt}-${index}`}>{item.input}</li>
                  ))}
                </ul>
              ) : (
                <p>No recent inputs yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Next Steps</h3>
            <ul className="mt-2 text-sm text-muted">
              <li>Configure Supabase project and update <code>.env</code></li>
              <li>Run Prisma migrate and seed initial data</li>
              <li>Swap stub pipeline logic for LLM prompts</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-surface/70 p-6">
            <h3 className="text-xl font-semibold">Interpret Notes</h3>
            <p className="mt-2 text-sm text-muted">
              Clarify is using heuristics for intent detection. Wire the Claude
              prompt in <code>src/lib/interpret/prompts.ts</code> when ready.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

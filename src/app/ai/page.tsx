"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Diagnostics = {
  reasoning: { steps: Array<{ id: string; title: string; rationale: string }> };
  confidence: { score: number; label: "low" | "medium" | "high" };
  fallbacks: Array<{ id: string; title: string; description: string }>;
};

export default function AIDiagnosticsPage() {
  const [task, setTask] = useState("");
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDiagnostics(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDiagnostics(null);
    const response = await fetch("/api/ai/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task })
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json?.error || "Diagnostics failed");
      return;
    }
    setDiagnostics(json);
  }

  return (
    <AppShell title="AI Diagnostics">
      <div className="grid gap-6">
        <form
          className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]"
          onSubmit={runDiagnostics}
        >
          <h2 className="text-xl font-semibold">Reasoning & Confidence</h2>
          <p className="mt-2 text-sm text-muted">
            Inspect reasoning steps, confidence, and fallback strategies.
          </p>
          <input
            className="mt-4 w-full rounded-2xl border border-ink/10 bg-surface/90 p-3 text-sm"
            placeholder="Describe a task..."
            value={task}
            onChange={(event) => setTask(event.target.value)}
          />
          <button
            className="mt-4 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white"
            type="submit"
          >
            Run diagnostics
          </button>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </form>

        {diagnostics ? (
          <div className="grid gap-6">
            <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
              <h3 className="text-lg font-semibold">Reasoning Steps</h3>
              <ul className="mt-3 text-sm text-muted">
                {diagnostics.reasoning.steps.map((step) => (
                  <li key={step.id}>
                    <span className="font-semibold">{step.title}:</span> {step.rationale}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
              <h3 className="text-lg font-semibold">Confidence</h3>
              <p className="mt-2 text-sm text-muted">
                {Math.round(diagnostics.confidence.score * 100)}% ({diagnostics.confidence.label})
              </p>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
              <h3 className="text-lg font-semibold">Fallback Strategies</h3>
              <ul className="mt-3 text-sm text-muted">
                {diagnostics.fallbacks.map((fallback) => (
                  <li key={fallback.id}>
                    <span className="font-semibold">{fallback.title}:</span> {fallback.description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

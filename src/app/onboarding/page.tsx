"use client";

import { useState } from "react";
import Link from "next/link";
import { useContextMemory } from "@/hooks/useContextMemory";

export default function OnboardingPage() {
  const { entries, upsert } = useContextMemory();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim() || !value.trim()) return;
    upsert({ id: label.toLowerCase().replace(/\s+/g, "-"), label, value });
    setLabel("");
    setValue("");
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-16">
      <div className="mx-auto max-w-3xl rounded-3xl border border-ink/10 bg-surface/80 p-8 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
        <h1 className="text-3xl font-semibold">Onboarding</h1>
        <p className="mt-2 text-sm text-muted">
          Capture key context so Clarify can personalize your automation.
        </p>

        <form className="mt-6 grid gap-3" onSubmit={handleAdd}>
          <label className="text-sm font-semibold">Context label</label>
          <input
            className="rounded-2xl border border-ink/10 bg-surface/90 p-3 text-sm"
            placeholder="Recruiter name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <label className="text-sm font-semibold">Context value</label>
          <input
            className="rounded-2xl border border-ink/10 bg-surface/90 p-3 text-sm"
            placeholder="Jamie at Acme"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button
            className="mt-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Save context
          </button>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">Saved context</h2>
          {entries.length ? (
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <span className="font-semibold">{entry.label}:</span> {entry.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No context yet.</p>
          )}
        </div>

        <div className="mt-8">
          <Link className="text-ember" href="/">
            Back to pipeline
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function CommandBar() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError("Enter a request to interpret.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to interpret request.");
        return;
      }

      setInput("");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-slate-400">
        <span>Command input</span>
        <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Agent ready
        </span>
      </div>

      <textarea
        className="mt-4 min-h-[130px] w-full resize-none bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
        placeholder="What do you need to get done?"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3l2.2 5.2L19.5 10l-5.3 1.9L12 17l-2.2-5.1L4.5 10l5.3-1.8L12 3z" />
            </svg>
          </span>
          Interpret → Plan → Authorize
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "Clarifying" : "Clarify"}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
    </form>
  );
}

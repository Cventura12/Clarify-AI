"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function PlanTrigger({ taskId, hasPlan }: { taskId: string; hasPlan: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to generate plan.");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || hasPlan}
        className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
          hasPlan
            ? "cursor-default border border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border border-[#d8d4cf] bg-white text-slate-700 hover:border-slate-300"
        } ${isPending ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {hasPlan ? "Plan ready" : isPending ? "Planning" : "Generate plan"}
      </button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TaskInterpretation } from "@/lib/schemas/interpret";

export default function TaskEditor({
  taskId,
  initialTask,
}: {
  taskId: string;
  initialTask: TaskInterpretation;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(JSON.stringify(initialTask, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Invalid JSON. Fix the interpretation before saving.");
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: parsed }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to update interpretation.");
        return;
      }

      setError(null);
      router.refresh();
    });
  };

  const handleReset = () => {
    setValue(JSON.stringify(initialTask, null, 2));
    setError(null);
  };

  return (
    <div className="rounded-xl border border-[#e6e4e1] bg-white p-3 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Interpretation</p>
          <p className="text-xs text-slate-500">Edit the JSON before generating a plan.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          {isOpen ? "Hide" : "Edit"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-[220px] w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] p-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-xl bg-[#6f6f73] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#5f5f63] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isPending ? "Saving" : "Save edits"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-[#d8d4cf] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              Reset
            </button>
            {error ? <span className="text-xs text-red-500">{error}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

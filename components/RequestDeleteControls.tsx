"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type RequestOption = {
  id: string;
  label: string;
};

export default function RequestDeleteControls({ requests }: { requests: RequestOption[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(requests[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedExists = useMemo(
    () => requests.some((request) => request.id === selectedId),
    [requests, selectedId]
  );

  const deleteOne = () => {
    if (!selectedId || !selectedExists) return;
    const confirmed = window.confirm("Delete this request and all related tasks/plans?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/requests/${selectedId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to delete request.");
        return;
      }
      router.refresh();
    });
  };

  const clearAll = () => {
    const confirmed = window.confirm("Clear all requests and related tasks/plans?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/requests", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to clear requests.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] rounded-2xl border border-white/15 bg-[#121621]/95 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.4)] backdrop-blur md:bottom-6 md:right-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Delete requests</p>
      <div className="mt-2 flex flex-col gap-2">
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#0f1420] px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-white/30"
        >
          {requests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={deleteOne}
            disabled={isPending || !selectedExists}
            className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete one
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={isPending || requests.length === 0}
            className="flex-1 rounded-lg border border-orange-400/30 bg-orange-500/15 px-3 py-2 text-xs font-semibold text-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
        </div>
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}

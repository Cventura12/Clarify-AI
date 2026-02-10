"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "History", value: "history" },
  { label: "Blocked", value: "blocked" },
];

export default function DashboardFilters({ total, active, blocked }: { total: number; active: number; blocked: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") ?? "all";

  const handleClick = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "all") {
      next.delete("view");
    } else {
      next.set("view", value);
    }
    router.push(`/?${next.toString()}`);
  };

  const getCount = (value: string) => {
    if (value === "active") return active;
    if (value === "blocked") return blocked;
    if (value === "history") return total - active;
    return total;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => handleClick(filter.value)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            view === filter.value
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-[#dedad4] bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          {filter.label}
          <span className="ml-2 text-[11px] text-slate-400">
            {getCount(filter.value)}
          </span>
        </button>
      ))}
    </div>
  );
}
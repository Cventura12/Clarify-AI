"use client";

export default function IntegrationPlaceholder({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{name}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          coming soon
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-[#d8d4cf] bg-[#fbfaf8] p-4 text-xs text-slate-500">
        OAuth flow and provider setup will go here.
      </div>
    </div>
  );
}

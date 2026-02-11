"use client";

export default function IntegrationPlaceholder({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">{name}</p>
          <p className="text-sm text-[var(--muted)]">{description}</p>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          coming soon
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-xs text-[var(--muted)]">
        OAuth flow and provider setup will go here.
      </div>
    </div>
  );
}

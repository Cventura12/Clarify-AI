export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: string;
}) {
  const styles: Record<string, string> = {
    critical: "border border-rose-400/30 bg-rose-500/15 text-rose-300",
    high: "border border-orange-400/30 bg-orange-500/15 text-orange-300",
    medium: "border border-slate-400/30 bg-slate-400/10 text-slate-300",
    low: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
    neutral: "border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--muted)]",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${styles[tone] ?? styles.neutral}`}>
      {label}
    </span>
  );
}

export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: string;
}) {
  const styles: Record<string, string> = {
    critical: "border border-red-100 bg-red-50 text-red-700",
    high: "border border-red-100 bg-red-50 text-red-700",
    medium: "border border-slate-200 bg-slate-100 text-slate-700",
    low: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    neutral: "border border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${styles[tone] ?? styles.neutral}`}>
      {label}
    </span>
  );
}

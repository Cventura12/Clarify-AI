type ConfidenceBadgeProps = {
  score?: number | null;
  label?: string;
};

const clampPercent = (value: number) => Math.min(99, Math.max(1, Math.round(value * 100)));

const getTone = (score: number) => {
  if (score >= 0.75) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (score >= 0.5) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-rose-50 text-rose-700 border-rose-100";
};

const getLabel = (score: number) => {
  if (score >= 0.8) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
};

export default function ConfidenceBadge({ score, label = "Confidence" }: ConfidenceBadgeProps) {
  if (typeof score !== "number") return null;
  const percent = clampPercent(score);
  const tone = getTone(score);

  const level = getLabel(score);

  return (
    <span
      title={`${label}: ${percent}%`}
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label} {level}
    </span>
  );
}

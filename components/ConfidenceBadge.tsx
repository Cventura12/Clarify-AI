type ConfidenceBadgeProps = {
  score?: number | null;
  label?: string;
};

const clampPercent = (value: number) => Math.min(99, Math.max(1, Math.round(value * 100)));

const getTone = (score: number) => {
  if (score >= 0.75) return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  if (score >= 0.5) return "border-amber-400/30 bg-amber-500/15 text-amber-300";
  return "border-rose-400/30 bg-rose-500/15 text-rose-300";
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

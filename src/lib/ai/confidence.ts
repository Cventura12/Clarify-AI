export type ConfidenceScore = {
  score: number;
  label: "low" | "medium" | "high";
};

export function scoreConfidence(value: number): ConfidenceScore {
  const normalized = Math.max(0, Math.min(value, 1));
  if (normalized < 0.4) return { score: normalized, label: "low" };
  if (normalized < 0.75) return { score: normalized, label: "medium" };
  return { score: normalized, label: "high" };
}

export type PriorityInput = {
  urgency?: number;
  importance?: number;
  deadlineDays?: number | null;
};

export function scorePriority({ urgency = 1, importance = 1, deadlineDays }: PriorityInput) {
  const urgencyScore = Math.max(0, Math.min(urgency, 3)) * 10;
  const importanceScore = Math.max(0, Math.min(importance, 3)) * 8;
  const deadlineScore =
    typeof deadlineDays === "number" && deadlineDays >= 0
      ? Math.max(0, 30 - deadlineDays) * 0.5
      : 0;

  return Math.round(urgencyScore + importanceScore + deadlineScore);
}

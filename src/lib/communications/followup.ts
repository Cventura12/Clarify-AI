export type FollowUpSuggestion = {
  suggestedAt: string;
  reason: string;
};

export function suggestFollowUp(lastSentAtIso: string, days = 3): FollowUpSuggestion {
  const lastSent = new Date(lastSentAtIso);
  const suggested = new Date(lastSent.getTime() + days * 24 * 60 * 60 * 1000);

  return {
    suggestedAt: suggested.toISOString(),
    reason: `No reply within ${days} days.`
  };
}

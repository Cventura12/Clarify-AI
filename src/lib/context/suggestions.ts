import type { ContextEntry } from "./memory";

export type Suggestion = {
  id: string;
  text: string;
  reason: string;
};

export function buildSuggestions(entries: ContextEntry[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const hasSchool = entries.some((entry) => entry.label.toLowerCase().includes("school"));
  const hasRecruiter = entries.some((entry) => entry.label.toLowerCase().includes("recruiter"));

  if (hasRecruiter) {
    suggestions.push({
      id: "follow-up",
      text: "Draft a follow-up email to the recruiter",
      reason: "Recruiter details are in your context."
    });
  }

  if (hasSchool) {
    suggestions.push({
      id: "deadlines",
      text: "Track scholarship deadlines from your school portal",
      reason: "School context suggests upcoming deadlines."
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "onboarding",
      text: "Add your top 3 life admin priorities",
      reason: "More context helps Clarify automate work."
    });
  }

  return suggestions;
}

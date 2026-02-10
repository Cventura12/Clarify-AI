import type { Task, UserPreference, UserProfile } from "@prisma/client";

export type InsightSuggestion = {
  id: string;
  title: string;
  detail: string;
};

const countBy = (tasks: Task[], predicate: (task: Task) => boolean) =>
  tasks.reduce((sum, task) => (predicate(task) ? sum + 1 : sum), 0);

export const buildPatternInsights = (
  tasks: Task[],
  profile: UserProfile | null,
  preferences: UserPreference[]
) => {
  const insights: InsightSuggestion[] = [];

  const jobCount = countBy(tasks, (task) => task.domain === "job_application");
  const scholarshipCount = countBy(tasks, (task) => task.domain === "scholarship");
  const followupCount = countBy(tasks, (task) => task.domain === "follow_up");

  if (jobCount >= 3) {
    insights.push({
      id: "job-followup-cadence",
      title: "Standardize job follow-ups",
      detail: "You have multiple job applications. Set a default follow-up cadence.",
    });
  }

  if (scholarshipCount >= 2) {
    insights.push({
      id: "scholarship-recommenders",
      title: "Save recommender contacts",
      detail: "Scholarship tasks often need letters. Store recommender info in profile.",
    });
  }

  if (followupCount >= 2) {
    insights.push({
      id: "followup-batching",
      title: "Batch your follow-ups",
      detail: "Combine follow-up drafts into a single review session.",
    });
  }

  const hasTimezone = preferences.some((pref) => pref.key === "timezone");
  if (!hasTimezone) {
    insights.push({
      id: "timezone-preference",
      title: "Add your time zone",
      detail: "Time zone helps schedule reminders accurately.",
    });
  }

  if (profile) {
    const filled = [profile.fullName, profile.email, profile.school, profile.graduationYear].filter(
      (value) => value && value.trim()
    );
    if (filled.length < 3) {
      insights.push({
        id: "profile-completion",
        title: "Complete profile basics",
        detail: "Auto-fill works best when name, email, and school are set.",
      });
    }
  }

  return insights.slice(0, 4);
};

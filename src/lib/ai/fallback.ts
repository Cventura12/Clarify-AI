export type FallbackStrategy = {
  id: string;
  title: string;
  description: string;
};

export function buildFallbacks(task: string): FallbackStrategy[] {
  return [
    {
      id: "manual-review",
      title: "Request manual review",
      description: `Ask for clarification before executing: ${task}`
    },
    {
      id: "safe-mode",
      title: "Safe mode",
      description: "Limit actions to drafts only until approved."
    }
  ];
}

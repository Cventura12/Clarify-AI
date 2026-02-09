export type ReasoningStep = {
  id: string;
  title: string;
  rationale: string;
};

export type ReasoningPlan = {
  steps: ReasoningStep[];
};

export function buildReasoningPlan(task: string): ReasoningPlan {
  return {
    steps: [
      {
        id: "r1",
        title: "Clarify the goal",
        rationale: `Confirm scope for: ${task}`
      },
      {
        id: "r2",
        title: "Identify dependencies",
        rationale: "Collect required info and assets."
      },
      {
        id: "r3",
        title: "Execute in sequence",
        rationale: "Run each action with approval checkpoints."
      }
    ]
  };
}

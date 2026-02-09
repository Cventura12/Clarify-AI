import { scorePriority } from "./scoring";

export type PlanStep = {
  title: string;
  order: number;
  dependsOn?: number[];
};

export type PlanResult = {
  taskTitle: string;
  priorityScore: number;
  steps: PlanStep[];
};

function inferSteps(taskTitle: string): PlanStep[] {
  const lower = taskTitle.toLowerCase();
  const steps: string[] = [];

  if (lower.includes("email") || lower.includes("follow up")) {
    steps.push("Draft the email", "Review and approve the draft", "Send the email");
  } else if (lower.includes("application") || lower.includes("apply")) {
    steps.push("Gather required documents", "Complete application form", "Submit application");
  } else if (lower.includes("form")) {
    steps.push("Collect required information", "Fill out the form", "Review and submit");
  } else if (lower.includes("schedule") || lower.includes("reminder")) {
    steps.push("Determine scheduling details", "Create reminder", "Confirm reminder set");
  } else {
    steps.push(`Clarify requirements for ${taskTitle}`, `Execute ${taskTitle}`, "Confirm completion");
  }

  return steps.map((title, index) => ({
    title,
    order: index + 1
  }));
}

function addDependencies(steps: PlanStep[]) {
  return steps.map((step, index) => ({
    ...step,
    dependsOn: index === 0 ? [] : [steps[index - 1].order]
  }));
}

function inferUrgency(taskTitle: string) {
  const lower = taskTitle.toLowerCase();
  if (lower.includes("asap") || lower.includes("urgent") || lower.includes("today")) return 3;
  if (lower.includes("soon") || lower.includes("tomorrow")) return 2;
  return 1;
}

export function buildPlan(taskTitle: string): PlanResult {
  const baseSteps = inferSteps(taskTitle);
  const steps = addDependencies(baseSteps);
  const priorityScore = scorePriority({ urgency: inferUrgency(taskTitle), importance: 2 });

  return {
    taskTitle,
    priorityScore,
    steps
  };
}

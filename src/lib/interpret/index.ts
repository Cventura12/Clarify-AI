export type InterpretTask = {
  title: string;
  description?: string;
  urgency?: number;
};

export type InterpretQuestion = {
  id: string;
  question: string;
};

export type InterpretResult = {
  intent: string;
  tasks: InterpretTask[];
  requiresClarification: boolean;
  questions: InterpretQuestion[];
  confidence: number;
};

const AMBIGUOUS_TOKENS = [
  "something",
  "stuff",
  "things",
  "it",
  "that",
  "this",
  "help",
  "fix",
  "take care of",
  "handle"
];

function detectUrgency(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("asap") || lower.includes("urgent") || lower.includes("today")) {
    return 3;
  }
  if (lower.includes("soon") || lower.includes("tomorrow")) {
    return 2;
  }
  return 1;
}

function detectIntent(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("email") || lower.includes("follow up")) return "communication";
  if (lower.includes("apply") || lower.includes("application")) return "application";
  if (lower.includes("schedule") || lower.includes("reminder")) return "scheduling";
  if (lower.includes("form")) return "form"
  return "general";
}

function splitTasks(input: string) {
  return input
    .split(/,| and /i)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title) => ({
      title,
      urgency: detectUrgency(title)
    }));
}

function isAmbiguous(input: string) {
  const lower = input.toLowerCase();
  if (input.trim().length < 8) return true
  return AMBIGUOUS_TOKENS.some((token) => lower.includes(token));
}

function buildQuestions(input: string) {
  return [
    {
      id: "scope",
      question: `What outcome do you want from: "${input}"?`
    },
    {
      id: "deadline",
      question: "Is there a deadline or priority level?"
    }
  ];
}

export async function interpretInput(input: string): Promise<InterpretResult> {
  const tasks = splitTasks(input);
  const ambiguous = isAmbiguous(input);
  return {
    intent: detectIntent(input),
    tasks: tasks.length ? tasks : [{ title: input, urgency: detectUrgency(input) }],
    requiresClarification: ambiguous,
    questions: ambiguous ? buildQuestions(input) : [],
    confidence: ambiguous ? 0.3 : 0.7
  };
}

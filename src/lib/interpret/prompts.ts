export const INTERPRET_SYSTEM_PROMPT = `
You are Clarify. Convert user requests into structured tasks.
Return JSON only with: intent, tasks (title, description, urgency), requiresClarification, questions.
`;

export const INTERPRET_USER_PROMPT = (input: string) => `User request: ${input}`;

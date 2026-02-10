import { EMAIL_TEMPLATES, getTemplateById, renderTemplate } from "./templates";

export type DraftInput = {
  action: string;
  detail?: string;
  recipientName?: string;
  senderName?: string;
  context?: string;
  templateId?: string;
};

const isEmailAction = (action: string, detail?: string) => {
  const text = `${action} ${detail ?? ""}`.toLowerCase();
  return text.includes("email") || text.includes("follow up") || text.includes("follow-up");
};

const pickTemplate = (input: DraftInput) => {
  if (input.templateId) return getTemplateById(input.templateId);
  const lower = input.action.toLowerCase();
  if (lower.includes("scholarship")) return getTemplateById("scholarship_follow_up");
  if (lower.includes("recommendation")) return getTemplateById("recommendation_reminder");
  if (lower.includes("application") || lower.includes("job")) return getTemplateById("job_application_follow_up");
  return EMAIL_TEMPLATES[0] ?? null;
};

export const generateDraft = (input: DraftInput) => {
  if (!isEmailAction(input.action, input.detail)) {
    return null;
  }

  const template = pickTemplate(input);
  if (!template) return null;

  const values = {
    recipient_name: input.recipientName ?? "there",
    sender_name: input.senderName ?? "",
    topic: input.context ?? input.action,
    role: input.context ?? "the role",
    program: input.context ?? "the program",
    submitted_date: "",
    deadline: "",
  };

  return {
    templateId: template.id,
    templateName: template.name,
    ...renderTemplate(template, values),
  };
};
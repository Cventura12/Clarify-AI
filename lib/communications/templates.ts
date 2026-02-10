export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  tags: string[];
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "follow_up_generic",
    name: "Follow-up: generic",
    subject: "Quick follow-up on {{topic}}",
    body:
      "Hi {{recipient_name}},\n\nI wanted to follow up on {{topic}}. I know you may be busy, so even a quick update on status or timeline would be helpful.\n\nThanks,\n{{sender_name}}",
    tags: ["follow_up", "generic"],
  },
  {
    id: "job_application_follow_up",
    name: "Job application follow-up",
    subject: "Following up on my application for {{role}}",
    body:
      "Hi {{recipient_name}},\n\nI recently applied for the {{role}} position and wanted to follow up to see if there is any additional information I can provide. I’m very interested in the role and would appreciate any update on timing.\n\nThanks,\n{{sender_name}}",
    tags: ["job_application", "follow_up"],
  },
  {
    id: "scholarship_follow_up",
    name: "Scholarship follow-up",
    subject: "Scholarship application follow-up — {{program}}",
    body:
      "Hello {{recipient_name}},\n\nI’m following up on my {{program}} scholarship application submitted on {{submitted_date}}. Could you confirm receipt and share any expected timeline for decisions?\n\nThank you,\n{{sender_name}}",
    tags: ["scholarship", "follow_up"],
  },
  {
    id: "recommendation_reminder",
    name: "Recommendation reminder",
    subject: "Gentle reminder: recommendation letter for {{program}}",
    body:
      "Hi {{recipient_name}},\n\nJust a gentle reminder about the recommendation letter for {{program}}. The deadline is {{deadline}}. Please let me know if you need anything from me.\n\nThank you,\n{{sender_name}}",
    tags: ["academic", "follow_up"],
  },
];

export const getTemplateById = (id: string) =>
  EMAIL_TEMPLATES.find((template) => template.id === id) ?? null;

export const renderTemplate = (template: EmailTemplate, values: Record<string, string>) => {
  const replace = (text: string) =>
    text.replace(/\{\{(.*?)\}\}/g, (_, key: string) => values[key.trim()] ?? "");

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
};
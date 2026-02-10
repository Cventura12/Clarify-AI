export type DocumentTemplate = {
  id: string;
  name: string;
  title: string;
  body: string;
  tags: string[];
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "personal_statement",
    name: "Personal Statement",
    title: "Personal Statement",
    body:
      "Dear {{committee}},\n\nI am writing to apply for {{program}}. {{story}}\n\nThank you for your consideration,\n{{applicant_name}}",
    tags: ["scholarship", "application"],
  },
  {
    id: "recommendation_request",
    name: "Recommendation Request",
    title: "Recommendation Request",
    body:
      "Hello {{recipient_name}},\n\nI hope you're well. I am applying for {{program}} and would be grateful if you could provide a recommendation letter. The deadline is {{deadline}}.\n\nThank you,\n{{applicant_name}}",
    tags: ["academic", "recommendation"],
  },
  {
    id: "appeal_letter",
    name: "Financial Aid Appeal",
    title: "Financial Aid Appeal",
    body:
      "To {{office}},\n\nI am requesting a review of my financial aid package for {{term}}. {{reason}}\n\nSincerely,\n{{applicant_name}}",
    tags: ["financial", "appeal"],
  },
];

export const getDocumentTemplate = (id: string) =>
  DOCUMENT_TEMPLATES.find((template) => template.id === id) ?? null;

export const renderDocument = (template: DocumentTemplate, values: Record<string, string>) => {
  const replace = (text: string) =>
    text.replace(/\{\{(.*?)\}\}/g, (_, key: string) => values[key.trim()] ?? "");

  return {
    title: replace(template.title),
    body: replace(template.body),
  };
};
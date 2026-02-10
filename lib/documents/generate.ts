import { DOCUMENT_TEMPLATES, getDocumentTemplate, renderDocument } from "./templates";

export type DocumentInput = {
  templateId?: string;
  context?: string;
  applicantName?: string;
  program?: string;
  deadline?: string;
  office?: string;
  reason?: string;
  committee?: string;
  recipientName?: string;
  story?: string;
};

const pickTemplate = (input: DocumentInput) => {
  if (input.templateId) return getDocumentTemplate(input.templateId);
  const context = (input.context ?? "").toLowerCase();
  if (context.includes("recommendation")) return getDocumentTemplate("recommendation_request");
  if (context.includes("appeal") || context.includes("financial aid")) return getDocumentTemplate("appeal_letter");
  return DOCUMENT_TEMPLATES[0] ?? null;
};

export const generateDocument = (input: DocumentInput) => {
  const template = pickTemplate(input);
  if (!template) return null;

  const values = {
    applicant_name: input.applicantName ?? "",
    program: input.program ?? input.context ?? "",
    deadline: input.deadline ?? "",
    office: input.office ?? "Financial Aid Office",
    reason: input.reason ?? "",
    committee: input.committee ?? "Committee",
    recipient_name: input.recipientName ?? "there",
    story: input.story ?? "",
  };

  return {
    templateId: template.id,
    templateName: template.name,
    ...renderDocument(template, values),
  };
};
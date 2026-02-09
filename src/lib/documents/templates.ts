export type DocumentTemplateKey = "cover_letter" | "checklist" | "summary";

    export type DocumentDraft = {
      title: string;
      body: string;
    };

    type TemplateInput = {
      subject?: string;
      name?: string;
      notes?: string;
    };

    const defaults: Required<TemplateInput> = {
      subject: "the task",
      name: "Caleb",
      notes: ""
    };

    export function renderDocumentTemplate(
      key: DocumentTemplateKey,
      input: TemplateInput = {}
    ): DocumentDraft {
      const data = { ...defaults, ...input };

      switch (key) {
        case "cover_letter":
          return {
            title: `Cover Letter - ${data.subject}`,
            body: `Hello,

I am writing to express my interest in ${data.subject}. My background and experience align well with the requirements.

Thank you,
${data.name}`
          };
        case "summary":
          return {
            title: `Summary - ${data.subject}`,
            body: `Summary for ${data.subject}.

Key points:
- ${data.notes || "Add highlights"}`
          };
        case "checklist":
        default:
          return {
            title: `Checklist - ${data.subject}`,
            body: `Checklist for ${data.subject}:
- Gather documents
- Complete forms
- Review and submit`
          };
      }
    }

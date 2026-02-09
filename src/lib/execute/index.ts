import {
  renderEmailTemplate,
  type EmailDraft,
  type EmailTemplateKey
} from "@/lib/communications/templates";
import { suggestFollowUp } from "@/lib/communications/followup";
import { renderDocumentTemplate, type DocumentDraft } from "@/lib/documents/templates";
import { buildFormAutofill, type FormField } from "@/lib/forms/fields";
import { storeFile, type StoredFile } from "@/lib/storage";
import { scheduleReminders, type Reminder } from "@/lib/deadlines/reminders";

export type ExecuteActionType =
  | "DRAFT_EMAIL"
  | "GENERATE_DOC"
  | "FILL_FORM"
  | "SET_REMINDER";

export type ExecuteAction = {
  id: string;
  title: string;
  type: ExecuteActionType;
  payload?: Record<string, unknown>;
  requiresApproval: boolean;
};

export type ExecuteResult = {
  ok: boolean;
  message: string;
  actionId: string;
  draft?: EmailDraft;
  followUp?: { suggestedAt: string; reason: string };
  notifications?: string[];
  document?: DocumentDraft;
  storedFile?: StoredFile;
  formFields?: FormField[];
  reminders?: Reminder[];
};

export function buildActions(stepTitle: string): ExecuteAction[] {
  const lower = stepTitle.toLowerCase();
  if (lower.includes("email") || lower.includes("follow up")) {
    return [
      {
        id: "act-1",
        title: "Draft follow-up email",
        type: "DRAFT_EMAIL",
        payload: {
          templateKey: "follow_up",
          context: "your application",
          recipientName: "Recruiter"
        },
        requiresApproval: true
      }
    ];
  }
  if (lower.includes("form")) {
    return [
      {
        id: "act-1",
        title: "Fill out form fields",
        type: "FILL_FORM",
        payload: { fields: ["name", "email", "phone"] },
        requiresApproval: true
      }
    ];
  }
  if (lower.includes("reminder") || lower.includes("schedule")) {
    return [
      {
        id: "act-1",
        title: "Create reminder",
        type: "SET_REMINDER",
        payload: { dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
        requiresApproval: true
      }
    ];
  }

  return [
    {
      id: "act-1",
      title: stepTitle,
      type: "GENERATE_DOC",
      payload: { template: "checklist", subject: stepTitle },
      requiresApproval: true
    }
  ];
}

export async function executeAction(action: ExecuteAction): Promise<ExecuteResult> {
  const notifications: string[] = [];
  let draft: EmailDraft | undefined;
  let followUp: { suggestedAt: string; reason: string } | undefined;
  let document: DocumentDraft | undefined;
  let storedFile: StoredFile | undefined;
  let formFields: FormField[] | undefined;
  let reminders: Reminder[] | undefined;

  if (action.type === "DRAFT_EMAIL") {
    const payload = (action.payload ?? {}) as {
      templateKey?: EmailTemplateKey;
      context?: string;
      recipientName?: string;
    };
    draft = renderEmailTemplate(payload.templateKey || "follow_up", {
      context: payload.context,
      recipientName: payload.recipientName
    });
    followUp = suggestFollowUp(new Date().toISOString(), 3);
    notifications.push("Draft ready for review.");
  }

  if (action.type === "SET_REMINDER") {
    const payload = (action.payload ?? {}) as { dueAt?: string };
    const dueAt = payload.dueAt ?? new Date().toISOString();
    reminders = scheduleReminders(dueAt);
    notifications.push("Reminders scheduled (mock).");
  }

  if (action.type === "FILL_FORM") {
    const payload = (action.payload ?? {}) as { fields?: string[] };
    const fields = payload.fields ?? ["name", "email", "phone"];
    formFields = buildFormAutofill(fields);
    notifications.push("Form fields populated (mock).");
  }

  if (action.type === "GENERATE_DOC") {
    const payload = (action.payload ?? {}) as {
      template?: "checklist" | "cover_letter" | "summary";
      subject?: string;
    };
    document = renderDocumentTemplate(payload.template || "checklist", {
      subject: payload.subject
    });
    storedFile = await storeFile(`${document.title}.txt`);
    notifications.push("Document draft generated (mock).");
  }

  return {
    ok: true,
    message: `Executed action ${action.type}: ${action.title}`,
    actionId: action.id,
    draft,
    followUp,
    notifications,
    document,
    storedFile,
    formFields,
    reminders
  };
}

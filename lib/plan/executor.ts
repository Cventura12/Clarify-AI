import { prisma } from "@/lib/db";
import { generateDraft } from "@/lib/communications/draft";
import { generateDocument } from "@/lib/documents/generate";
import { inferFormFields } from "@/lib/forms/fields";
import { storeArtifact } from "@/lib/storage";
import { getProfile } from "@/lib/profile";
import type { Step } from "@prisma/client";

type ExecuteResult =
  | { ok: true; step: Step }
  | { ok: false; status: number; message: string };

const executeStepOutcome = (delegation: string, action: string, detail?: string) => {
  switch (delegation) {
    case "can_draft":
      return { outcome: `Draft prepared for: ${action}` };
    case "can_remind":
      return { outcome: `Reminder scheduled for: ${action}` };
    case "can_track":
      return { outcome: `Tracking enabled for: ${action}` };
    default:
      return null;
  }
};

const detectDocumentAction = (action: string, detail?: string) => {
  const text = `${action} ${detail ?? ""}`.toLowerCase();
  return text.includes("document") || text.includes("essay") || text.includes("letter");
};

const detectFormAction = (action: string, detail?: string) => {
  const text = `${action} ${detail ?? ""}`.toLowerCase();
  return text.includes("form") || text.includes("application") || text.includes("portal");
};

const logExecutionBlocked = async (step: Step, reason: string) => {
  await prisma.executionLog.create({
    data: {
      stepId: step.id,
      action: "Execution blocked",
      status: "failed",
      actor: "system",
      detail: {
        reason,
        action: step.action,
      },
    },
  });
};

export const executeAuthorizedStep = async (stepId: string): Promise<ExecuteResult> => {
  const step = await prisma.step.findUnique({
    where: { id: stepId },
  });

  if (!step) {
    return { ok: false, status: 404, message: "Step not found" };
  }

  if (step.status !== "authorized") {
    return { ok: false, status: 400, message: "Step must be authorized before execution" };
  }

  const executionResult = executeStepOutcome(step.delegation, step.action, step.detail);
  if (!executionResult) {
    await logExecutionBlocked(step, "User-only step");
    return { ok: false, status: 400, message: "This step is user-only and cannot be executed" };
  }

  const draft = step.delegation === "can_draft" ? generateDraft({ action: step.action, detail: step.detail }) : null;
  const document = detectDocumentAction(step.action, step.detail)
    ? generateDocument({ context: step.action })
    : null;
  const isForm = detectFormAction(step.action, step.detail);
  const profile = isForm ? await getProfile() : null;
  const form = isForm ? { fields: inferFormFields(step.action, profile) } : null;

  const artifactUrls: Record<string, string> = {};
  const artifactErrors: string[] = [];

  const storeSafely = async (label: string, payload: { name: string; content: string; type: "draft" | "document" | "form"; contentType: string }) => {
    try {
      const record = await storeArtifact({
        name: payload.name,
        content: payload.content,
        type: payload.type,
        contentType: payload.contentType,
        stepId: step.id,
      });
      artifactUrls[label] = record.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Storage error";
      artifactErrors.push(`${label}: ${message}`);
    }
  };

  if (draft?.subject && draft.body) {
    await storeSafely("draft", {
      name: `${draft.subject}.txt`,
      content: `Subject: ${draft.subject}\n\n${draft.body}`,
      type: "draft",
      contentType: "text/plain",
    });
  }

  if (document?.title && document.body) {
    await storeSafely("document", {
      name: `${document.title}.md`,
      content: `# ${document.title}\n\n${document.body}`,
      type: "document",
      contentType: "text/markdown",
    });
  }

  if (form?.fields?.length) {
    await storeSafely("form", {
      name: `form-${step.stepNumber}.json`,
      content: JSON.stringify(form.fields, null, 2),
      type: "form",
      contentType: "application/json",
    });
  }

  const updated = await prisma.step.update({
    where: { id: step.id },
    data: {
      status: "done",
      completedAt: new Date(),
      outcome: executionResult.outcome,
    },
  });

  await prisma.executionLog.create({
    data: {
      stepId: updated.id,
      action: "Step executed",
      status: "executed",
      actor: "system",
      detail: {
        outcome: executionResult.outcome,
        action: updated.action,
        draft,
        document,
        form,
        artifacts: artifactUrls,
        artifactErrors,
      },
    },
  });

  return { ok: true, step: updated };
};

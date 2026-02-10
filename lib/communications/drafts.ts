import type { JsonValue } from "@prisma/client/runtime/library";

export type DraftEntry = {
  id: string;
  subject: string;
  body: string;
  to?: string;
  templateName?: string;
  createdAt: Date;
  sentAt?: Date | null;
  followUpAt?: Date | null;
  delivery?: {
    id?: string | null;
    status?: string | null;
    provider?: string | null;
  } | null;
};

type DraftDetail = {
  templateName?: string;
  subject?: string;
  body?: string;
  to?: string;
  sentAt?: string | null;
  followUpAt?: string | null;
  delivery?: {
    id?: string | null;
    status?: string | null;
    provider?: string | null;
  } | null;
};

type LogDetail = {
  draft?: DraftDetail | null;
};

const isRecord = (value: JsonValue | null): value is Record<string, JsonValue> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const extractDraftsFromLogs = (
  logs: Array<{ id: string; detail: JsonValue | null; createdAt: Date }>
): DraftEntry[] => {
  const drafts: DraftEntry[] = [];

  logs.forEach((log) => {
    if (!isRecord(log.detail)) return;
    const detail = log.detail as unknown as LogDetail;
    const draft = detail?.draft;
    if (!draft?.subject || !draft?.body) return;

    drafts.push({
      id: log.id,
      subject: draft.subject,
      body: draft.body,
      to: draft.to,
      templateName: draft.templateName,
      createdAt: log.createdAt,
      sentAt: draft.sentAt ? new Date(draft.sentAt) : null,
      followUpAt: draft.followUpAt ? new Date(draft.followUpAt) : null,
      delivery: draft.delivery ?? null,
    });
  });

  return drafts;
};

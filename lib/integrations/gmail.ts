export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

type GmailListResponse = {
  messages?: Array<{ id: string; threadId: string }>;
};

type GmailMessageResponse = {
  id?: string;
  threadId?: string;
  snippet?: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
};

const getHeader = (headers: Array<{ name: string; value: string }> | undefined, key: string) => {
  if (!headers) return "";
  const match = headers.find((header) => header.name.toLowerCase() === key.toLowerCase());
  return match?.value ?? "";
};

export const listGmailMessages = async (accessToken: string, query: string, maxResults = 10) => {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gmail list error: ${response.status} ${errorText}`);
  }

  const data = (await response.json().catch(() => ({}))) as GmailListResponse;
  const messages = data.messages ?? [];
  if (messages.length === 0) return [];

  const results: GmailMessageSummary[] = [];
  for (const message of messages) {
    const detail = await getGmailMessage(accessToken, message.id);
    results.push(detail);
  }
  return results;
};

export const getGmailMessage = async (accessToken: string, id: string) => {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gmail message error: ${response.status} ${errorText}`);
  }

  const data = (await response.json().catch(() => ({}))) as GmailMessageResponse;
  const headers = data.payload?.headers ?? [];
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const date = getHeader(headers, "Date");

  return {
    id: data.id ?? id,
    threadId: data.threadId ?? "",
    subject,
    from,
    date,
    snippet: data.snippet ?? "",
  };
};

const normalizeCompany = (from: string) => {
  const match = from.split("<")[0]?.trim();
  return match || from;
};

export const findJobApplications = async (accessToken: string, maxResults = 10) => {
  const query =
    'subject:("application" OR "applied" OR "thank you for applying" OR "application received" OR "we received your application")';
  const messages = await listGmailMessages(accessToken, query, maxResults);

  return messages.map((message) => ({
    threadId: message.threadId,
    company: normalizeCompany(message.from) || "Unknown",
    role: message.subject || "Application",
    source: "gmail",
    appliedAt: message.date ? new Date(message.date) : null,
  }));
};

const toBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const sendGmailMessage = async (
  accessToken: string,
  input: { to: string; subject: string; body: string }
) => {
  const raw = [
    `To: ${input.to}`,
    "Content-Type: text/plain; charset=\"UTF-8\"",
    "MIME-Version: 1.0",
    `Subject: ${input.subject}`,
    "",
    input.body,
  ].join("\r\n");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(raw) }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Gmail send error: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => ({}));
};

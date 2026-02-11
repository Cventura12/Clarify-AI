import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

const NOTION_API_VERSION = "2022-06-28";

type NotionRequestOptions = {
  method?: "GET" | "POST";
  accessToken: string;
  path: string;
  body?: Record<string, unknown>;
};

export type NotionSyncItem = {
  summary: string;
  description?: string;
  dueDate: string | null;
  urgency: string;
};

export type NotionCreatedPage = {
  id?: string;
  status: string;
  summary: string;
};

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

const notionRequest = async ({
  method = "GET",
  accessToken,
  path,
  body,
}: NotionRequestOptions) => {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_API_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Notion API error: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => ({}));
};

const toBasicAuth = (clientId: string, clientSecret: string) =>
  Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

const sanitizeNotionId = (value: string) => value.replace(/-/g, "").trim();

export const getNotionAuthUrl = (state: string) => {
  const clientId = getEnv("NOTION_CLIENT_ID");
  const redirectUri = getEnv("NOTION_REDIRECT_URI");
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
};

export const exchangeNotionCode = async (code: string) => {
  const clientId = getEnv("NOTION_CLIENT_ID");
  const clientSecret = getEnv("NOTION_CLIENT_SECRET");
  const redirectUri = getEnv("NOTION_REDIRECT_URI");

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${toBasicAuth(clientId, clientSecret)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Notion token error: ${response.status}`);
  }

  return {
    accessToken: typeof data.access_token === "string" ? data.access_token : "",
    workspaceName: typeof data.workspace_name === "string" ? data.workspace_name : null,
    workspaceIcon: typeof data.workspace_icon === "string" ? data.workspace_icon : null,
    workspaceId: typeof data.workspace_id === "string" ? data.workspace_id : null,
    botId: typeof data.bot_id === "string" ? data.bot_id : null,
  };
};

export const testNotionConnection = async (accessToken: string, databaseId?: string) => {
  const me = await notionRequest({ accessToken, path: "/users/me" });
  if (!databaseId) {
    return { me };
  }

  const database = await notionRequest({
    accessToken,
    path: `/databases/${sanitizeNotionId(databaseId)}`,
  });
  return { me, database };
};

export const buildNotionItemsFromTasks = (tasks: Task[]): NotionSyncItem[] => {
  return tasks.map((task) => {
    const dates = asArray<{ date: string | null; description?: string }>(task.dates);
    const due = dates.find((item) => item.date);
    return {
      summary: task.title,
      description: task.summary,
      dueDate: due?.date ?? null,
      urgency: task.urgency,
    };
  });
};

const getTitlePropertyName = async (accessToken: string, databaseId: string) => {
  const database = (await notionRequest({
    accessToken,
    path: `/databases/${sanitizeNotionId(databaseId)}`,
  })) as { properties?: Record<string, { type?: string }> };

  const properties = database.properties ?? {};
  const titleEntry = Object.entries(properties).find(([, value]) => value?.type === "title");
  if (!titleEntry) {
    throw new Error("Notion database has no title property");
  }

  return titleEntry[0];
};

export const syncTasksToNotion = async (
  accessToken: string,
  databaseId: string,
  items: NotionSyncItem[]
) => {
  const safeDatabaseId = sanitizeNotionId(databaseId);
  const titleProperty = await getTitlePropertyName(accessToken, safeDatabaseId);
  const created: NotionCreatedPage[] = [];

  for (const item of items) {
    const payload: Record<string, unknown> = {
      parent: { database_id: safeDatabaseId },
      properties: {
        [titleProperty]: {
          title: [
            {
              text: {
                content: item.summary.slice(0, 1900),
              },
            },
          ],
        },
      },
    };

    if (item.description) {
      payload.children = [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: item.description.slice(0, 1800),
                },
              },
            ],
          },
        },
      ];
    }

    const page = (await notionRequest({
      method: "POST",
      accessToken,
      path: "/pages",
      body: payload,
    })) as { id?: string };

    created.push({
      id: page.id,
      status: "created",
      summary: item.summary,
    });
  }

  return created;
};

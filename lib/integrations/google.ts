import type { Task } from "@prisma/client";
import type { JsonValue } from "@prisma/client/runtime/library";

const asArray = <T,>(value: JsonValue): T[] => (Array.isArray(value) ? (value as T[]) : []);

export type GoogleCalendarConfig = {
  accessToken: string;
  calendarId: string;
};

export type CalendarEventInput = {
  summary: string;
  description?: string;
  dueDate: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }
  return value;
};

export const getGoogleAuthUrl = (state: string) => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const exchangeGoogleCode = async (code: string) => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI");

  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!response.ok) {
    throw new Error(`Google token error: ${response.status}`);
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  return {
    accessToken: data.access_token ?? "",
    refreshToken: data.refresh_token ?? null,
    expiresAt,
    scope: data.scope ?? null,
  };
};

export const refreshGoogleToken = async (refreshToken: string) => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
  if (!response.ok) {
    throw new Error(`Google refresh error: ${response.status}`);
  }

  const expiresAt = data.expires_in
    ? new Date(Date.now() + data.expires_in * 1000).toISOString()
    : null;

  return {
    accessToken: data.access_token ?? "",
    expiresAt,
    scope: data.scope ?? null,
  };
};

export const testGoogleCalendarConnection = async (
  config: GoogleCalendarConfig
) => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google Calendar test failed: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => ({}));
};

export const buildEventsFromTasks = (tasks: Task[]): CalendarEventInput[] => {
  const events: CalendarEventInput[] = [];
  tasks.forEach((task) => {
    const dates = asArray<{ date: string | null; description?: string }>(task.dates);
    const due = dates.find((item) => item.date);
    if (!due?.date) return;
    events.push({
      summary: task.title,
      description: due.description ?? task.summary,
      dueDate: due.date,
    });
  });
  return events;
};

export const pushEventsToGoogle = async (
  config: GoogleCalendarConfig,
  events: CalendarEventInput[]
) => {
  const results: Array<{ id?: string; status: string; summary: string }> = [];

  for (const event of events) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: { date: event.dueDate },
          end: { date: event.dueDate },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      results.push({
        status: `error:${response.status}`,
        summary: event.summary,
      });
      throw new Error(`Google Calendar error: ${response.status} ${errorText}`);
    }

    const data = await response.json().catch(() => ({}));
    results.push({
      id: data?.id,
      status: "created",
      summary: event.summary,
    });
  }

  return results;
};

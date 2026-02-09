import type { Integration } from "./types";

export const integrationRegistry: Integration[] = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sync deadlines and reminders.",
    status: "disconnected",
    oauthRequired: true
  },
  {
    id: "notion",
    name: "Notion",
    description: "Push plans and docs into Notion.",
    status: "disconnected",
    oauthRequired: true
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send approvals and reminders to Slack.",
    status: "disconnected",
    oauthRequired: true
  }
];

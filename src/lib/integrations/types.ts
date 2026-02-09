export type IntegrationStatus = "connected" | "disconnected" | "error";

export type Integration = {
  id: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  oauthRequired: boolean;
};

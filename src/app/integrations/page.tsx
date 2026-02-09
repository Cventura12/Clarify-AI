"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type Integration = {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  oauthRequired: boolean;
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => setIntegrations(data.integrations ?? []))
      .catch(() => setIntegrations([]));
  }, []);

  async function connect(provider: "google" | "notion" | "slack") {
    const response = await fetch("/api/integrations/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json?.error || "Unable to start OAuth");
      return;
    }
    setMessage(`OAuth flow ready: ${json.url}`);
  }

  async function syncCalendar() {
    const response = await fetch("/api/integrations/sync", { method: "POST" });
    const json = await response.json();
    setMessage(json?.message || "Sync complete");
  }

  return (
    <AppShell title="Integrations">
      <div className="grid gap-6">
        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
          <h2 className="text-xl font-semibold">Connected Services</h2>
          <p className="mt-2 text-sm text-muted">
            OAuth connections are mocked until credentials are added.
          </p>
          {message ? (
            <p className="mt-3 text-sm text-emerald-700">{message}</p>
          ) : null}
          <div className="mt-4 grid gap-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {integration.name}
                  </p>
                  <p className="text-xs text-muted/80">
                    {integration.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full border border-ink/10 px-3 py-1 text-xs">
                    {integration.status}
                  </span>
                  {integration.oauthRequired ? (
                    <button
                      className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white"
                      onClick={() =>
                        connect(
                          integration.id === "google-calendar"
                            ? "google"
                            : integration.id === "notion"
                              ? "notion"
                              : "slack"
                        )
                      }
                    >
                      Connect
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-surface/80 p-6 shadow-[0_20px_60px_rgba(12,15,20,0.15)]">
          <h2 className="text-xl font-semibold">Calendar Sync</h2>
          <p className="mt-2 text-sm text-muted">
            Sync deadlines from Google Calendar (mock).
          </p>
          <button
            className="mt-4 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white"
            onClick={syncCalendar}
          >
            Sync now
          </button>
        </div>
      </div>
    </AppShell>
  );
}

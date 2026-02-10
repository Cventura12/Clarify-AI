"use client";

import { useState, useTransition } from "react";

type IntegrationCardProps = {
  provider: string;
  name: string;
  description: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  lastSync?: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700";

export default function IntegrationCard({
  provider,
  name,
  description,
  status,
  metadata,
  lastSync,
}: IntegrationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [calendarId, setCalendarId] = useState((metadata?.calendarId as string) ?? "");
  const expiresAt = typeof metadata?.expiresAt === "string" ? metadata.expiresAt : "";
  const refreshedAt = typeof metadata?.refreshedAt === "string" ? metadata.refreshedAt : "";
  const expiresLabel = expiresAt ? new Date(expiresAt).toLocaleString() : "Unknown";
  const refreshedLabel = refreshedAt ? new Date(refreshedAt).toLocaleString() : "Never";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<
    Array<{ summary?: string; dueDate?: string; description?: string }>
  >([]);

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          status: "connected",
          metadata: {
            calendarId,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to save integration");
        return;
      }
      setMessage("Saved");
    });
  };

  const disconnect = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          status: "disconnected",
          metadata: {},
          replaceMetadata: true,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to disconnect");
        return;
      }
      setCalendarId("");
      setMessage("Disconnected");
    });
  };

  const sync = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Sync failed");
        return;
      }
      setMessage("Sync completed");
    });
  };

  const preview = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Preview failed");
        return;
      }
      const count = Array.isArray(data?.result?.events) ? data.result.events.length : 0;
      const events = Array.isArray(data?.result?.events) ? data.result.events : [];
      setPreviewEvents(events);
      setPreviewOpen(true);
      setMessage(`Preview ready: ${count} event${count === 1 ? "" : "s"}`);
    });
  };

  const test = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Test failed");
        return;
      }
      setMessage("Connection OK");
    });
  };

  const refresh = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch(`/api/integrations/${provider}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshOnly: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Refresh failed");
        return;
      }
      setMessage("Token refreshed");
    });
  };

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{name}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "connected"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Calendar ID</label>
          <input
            value={calendarId}
            onChange={(event) => setCalendarId(event.target.value)}
            placeholder="primary"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <a
          href="/api/integrations/google/authorize"
          className="rounded-full bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white"
        >
          {status === "connected" ? "Reconnect" : "Connect"}
        </a>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
        >
          {isPending ? "Saving" : "Save calendar"}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
        >
          Test
        </button>
        <button
          type="button"
          onClick={refresh}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
        >
          Refresh token
        </button>
        <button
          type="button"
          onClick={sync}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
        >
          Sync
        </button>
        <button
          type="button"
          onClick={preview}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={disconnect}
          disabled={isPending}
          className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-500"
        >
          Disconnect
        </button>
        {lastSync ? <span className="text-xs text-slate-400">Last sync {lastSync}</span> : null}
        <span className="text-xs text-slate-400">Token expires {expiresLabel}</span>
        <span className="text-xs text-slate-400">Refreshed {refreshedLabel}</span>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Preview</p>
                <p className="text-base font-semibold text-slate-900">Calendar events</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full border border-[#d8d4cf] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {previewEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No events to sync.</p>
              ) : (
                previewEvents.map((event, index) => (
                  <div key={`${event.summary ?? "event"}-${index}`} className="rounded-xl border border-[#ece9e5] bg-[#fbfaf8] p-3">
                    <p className="text-sm font-semibold text-slate-900">{event.summary ?? "Untitled event"}</p>
                    <p className="text-xs text-slate-500">
                      {event.dueDate ? `Due ${new Date(event.dueDate).toLocaleDateString()}` : "No date"}
                    </p>
                    {event.description ? (
                      <p className="mt-1 text-xs text-slate-400">{event.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

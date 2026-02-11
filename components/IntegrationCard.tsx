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
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)]";

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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">{name}</p>
          <p className="text-sm text-[var(--muted)]">{description}</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          <span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-emerald-400" : "bg-slate-400"}`} />
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">Calendar ID</label>
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
          className="rounded-full bg-[var(--text)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--surface)]"
        >
          {status === "connected" ? "Reconnect" : "Connect"}
        </a>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
        >
          {isPending ? "Saving" : "Save calendar"}
        </button>
        <button
          type="button"
          onClick={sync}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
        >
          Sync
        </button>
        <button
          type="button"
          onClick={disconnect}
          disabled={isPending}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--kicker)]"
        >
          Disconnect
        </button>
      </div>

      <details className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted)]">
        <summary className="cursor-pointer font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          Advanced
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={test}
            disabled={isPending || status !== "connected"}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            Test
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={isPending || status !== "connected"}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            Refresh token
          </button>
          <button
            type="button"
            onClick={preview}
            disabled={isPending || status !== "connected"}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
          >
            Preview
          </button>
        </div>
        <div className="mt-3 space-y-1 text-xs text-[var(--kicker)]">
          {lastSync ? <div>Last sync {lastSync}</div> : null}
          <div>Token expires {expiresLabel}</div>
          <div>Refreshed {refreshedLabel}</div>
          {message ? <div>{message}</div> : null}
        </div>
      </details>

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

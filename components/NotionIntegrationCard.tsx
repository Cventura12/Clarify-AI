"use client";

import { useState, useTransition } from "react";

type NotionIntegrationCardProps = {
  status: string;
  metadata?: Record<string, unknown> | null;
  lastSync?: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)]";

export default function NotionIntegrationCard({
  status,
  metadata,
  lastSync,
}: NotionIntegrationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState((metadata?.databaseId as string) ?? "");
  const workspaceName = typeof metadata?.workspaceName === "string" ? metadata.workspaceName : "";

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "notion",
          status: "connected",
          metadata: { databaseId },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to save database");
        return;
      }
      setMessage("Saved");
    });
  };

  const test = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOnly: true }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Connection test failed");
        return;
      }
      setMessage("Connection OK");
    });
  };

  const sync = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Notion sync failed");
        return;
      }
      const count = Array.isArray(data?.result?.pages) ? data.result.pages.length : 0;
      setMessage(`Synced ${count} page${count === 1 ? "" : "s"}`);
    });
  };

  const disconnect = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "notion",
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

      setDatabaseId("");
      setMessage("Disconnected");
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">Notion</p>
          <p className="text-sm text-[var(--muted)]">Connect a Notion workspace and database for task sync.</p>
          {workspaceName ? (
            <p className="mt-1 text-xs text-[var(--kicker)]">Workspace: {workspaceName}</p>
          ) : null}
        </div>
        <span className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          <span className={`h-2 w-2 rounded-full ${status === "connected" ? "bg-emerald-400" : "bg-slate-400"}`} />
          {status}
        </span>
      </div>

      <div className="mt-4">
        <label className="text-xs uppercase tracking-[0.3em] text-[var(--kicker)]">Database ID</label>
        <input
          value={databaseId}
          onChange={(event) => setDatabaseId(event.target.value)}
          placeholder="Paste Notion database id"
          className={fieldClass}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <a
          href="/api/integrations/notion/authorize"
          className="rounded-full bg-[var(--text)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--surface)]"
        >
          {status === "connected" ? "Reconnect" : "Connect"}
        </a>
        <button
          type="button"
          onClick={save}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--muted)] disabled:opacity-50"
        >
          Save database
        </button>
        <button
          type="button"
          onClick={test}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--muted)] disabled:opacity-50"
        >
          Test
        </button>
        <button
          type="button"
          onClick={sync}
          disabled={isPending || status !== "connected"}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-[var(--muted)] disabled:opacity-50"
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

      <div className="mt-3 space-y-1 text-xs text-[var(--kicker)]">
        {lastSync ? <div>Last sync {lastSync}</div> : null}
        {message ? <div>{message}</div> : null}
      </div>
    </div>
  );
}

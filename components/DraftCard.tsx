"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DraftEntry } from "@/lib/communications/drafts";

export default function DraftCard({ draft }: { draft: DraftEntry }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [to, setTo] = useState(draft.to ?? "");
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [followUpDate, setFollowUpDate] = useState(
    draft.followUpAt ? new Date(draft.followUpAt).toISOString().slice(0, 10) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, to }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to update draft");
        return;
      }

      setIsEditing(false);
      router.refresh();
    });
  };

  const send = () => {
    setError(null);
    if (!to.trim()) {
      setError("Recipient email is required");
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/drafts/${draft.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to send draft");
        return;
      }
      router.refresh();
    });
  };

  const scheduleFollowUp = () => {
    setError(null);
    if (!followUpDate) {
      setError("Pick a follow-up date");
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/drafts/${draft.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpAt: followUpDate }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to schedule follow-up");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Draft</p>
          <p className="text-sm text-slate-500">
            {draft.templateName ?? "Custom"} · {draft.createdAt.toLocaleString()}
          </p>
        </div>
        {draft.sentAt ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Sent {draft.sentAt.toLocaleDateString()}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Draft
          </span>
        )}
        {draft.followUpAt ? (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            Follow-up {draft.followUpAt.toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Subject</p>
          {isEditing ? (
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="text-sm font-semibold text-slate-900">{draft.subject}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">To</p>
          {isEditing ? (
            <input
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="text-sm text-slate-600">{draft.to ?? "Recipient not set"}</p>
          )}
        </div>
        {draft.sentAt && draft.delivery ? (
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Delivery</p>
            <p className="text-xs text-slate-500">
              {(draft.delivery.provider ?? "provider").toString()} ·{" "}
              {(draft.delivery.status ?? "sent").toString()} ·{" "}
              {(draft.delivery.id ?? "unknown").toString()}
            </p>
          </div>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Body</p>
          {isEditing ? (
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm text-slate-600">{draft.body}</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Follow-up</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={followUpDate}
              onChange={(event) => setFollowUpDate(event.target.value)}
              className="rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={scheduleFollowUp}
              disabled={isPending}
              className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {isPending ? "Scheduling" : "Schedule"}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
        {isEditing ? (
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-full bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white"
          >
            {isPending ? "Saving" : "Save"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
          >
            Edit
          </button>
        )}

        {!draft.sentAt ? (
          <button
            type="button"
            onClick={send}
            disabled={isPending}
            className="rounded-full bg-[#6f6f73] px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white"
          >
            {isPending ? "Sending" : "Send email"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

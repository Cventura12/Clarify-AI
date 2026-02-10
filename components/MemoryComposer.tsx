"use client";

import { useState, useTransition } from "react";

export default function MemoryComposer() {
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    if (!content.trim()) {
      setMessage("Enter a note to save.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to save memory");
        return;
      }
      setContent("");
      setMessage("Memory saved");
      window.location.reload();
    });
  };

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Add memory</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
        >
          <option value="note">Note</option>
          <option value="preference">Preference</option>
          <option value="context">Context</option>
        </select>
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Something Clarify should remember"
          className="flex-1 rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
        />
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
        >
          {isPending ? "Saving" : "Save"}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
    </div>
  );
}

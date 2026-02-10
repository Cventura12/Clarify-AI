"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function JobApplicationsClient() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("applied");
  const [portalUrl, setPortalUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          role,
          status,
          portalUrl: portalUrl || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to add application");
        return;
      }
      setCompany("");
      setRole("");
      setPortalUrl("");
      setNotes("");
      setMessage("Added");
      router.refresh();
    });
  };

  const importFromGmail = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/job-applications/import", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Import failed");
        return;
      }
      setMessage(`Imported ${data?.imported ?? 0}`);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-[#e6e4e1] bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Company</label>
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Role</label>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</label>
            <input
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
              placeholder="applied"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Portal URL</label>
            <input
              value={portalUrl}
              onChange={(event) => setPortalUrl(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Notes</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700"
            rows={3}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-slate-900 px-4 py-2 font-semibold uppercase tracking-[0.2em] text-white"
          >
            {isPending ? "Saving" : "Add application"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={importFromGmail}
            className="rounded-full border border-[#d8d4cf] bg-white px-4 py-2 font-semibold uppercase tracking-[0.2em] text-slate-600"
          >
            Import from Gmail
          </button>
          {message ? <span className="text-xs text-slate-500">{message}</span> : null}
        </div>
      </form>
    </div>
  );
}

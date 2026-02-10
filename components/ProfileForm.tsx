"use client";

import { useState, useTransition } from "react";
import type { UserProfile } from "@prisma/client";

type ProfileFormProps = {
  profile: UserProfile | null;
};

const fieldClass =
  "w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700";

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    postalCode: profile?.postalCode ?? "",
    country: profile?.country ?? "",
    school: profile?.school ?? "",
    graduationYear: profile?.graduationYear ?? "",
    gpa: profile?.gpa ?? "",
    linkedIn: profile?.linkedIn ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to save profile");
        return;
      }
      setMessage("Profile saved");
    });
  };

  return (
    <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Full name</label>
          <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</label>
          <input value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Phone</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">LinkedIn</label>
          <input value={form.linkedIn} onChange={(e) => update("linkedIn", e.target.value)} className={fieldClass} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Address</label>
          <input value={form.address} onChange={(e) => update("address", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">City</label>
          <input value={form.city} onChange={(e) => update("city", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">State</label>
          <input value={form.state} onChange={(e) => update("state", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Postal code</label>
          <input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Country</label>
          <input value={form.country} onChange={(e) => update("country", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">School</label>
          <input value={form.school} onChange={(e) => update("school", e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Graduation year</label>
          <input
            value={form.graduationYear}
            onChange={(e) => update("graduationYear", e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-slate-400">GPA</label>
          <input value={form.gpa} onChange={(e) => update("gpa", e.target.value)} className={fieldClass} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
        >
          {isPending ? "Saving" : "Save profile"}
        </button>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>
    </div>
  );
}

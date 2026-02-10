"use client";

import { useState, useTransition } from "react";
import type { UserProfile, UserPreference } from "@prisma/client";

type OnboardingFormProps = {
  profile: UserProfile | null;
  preferences: UserPreference[];
};

const fieldClass =
  "w-full rounded-lg border border-[#e6e4e1] bg-[#fbfaf8] px-3 py-2 text-sm text-slate-700";

const prefValue = (prefs: UserPreference[], key: string) =>
  prefs.find((pref) => pref.key === key)?.value ?? "";

export default function OnboardingForm({ profile, preferences }: OnboardingFormProps) {
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    school: profile?.school ?? "",
    graduationYear: profile?.graduationYear ?? "",
    timezone: prefValue(preferences, "timezone"),
    communication: prefValue(preferences, "communication_style"),
    availability: prefValue(preferences, "availability"),
    focus: prefValue(preferences, "focus_area"),
    notes: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            school: form.school,
            graduationYear: form.graduationYear,
          },
          preferences: [
            { key: "timezone", value: form.timezone },
            { key: "communication_style", value: form.communication },
            { key: "availability", value: form.availability },
            { key: "focus_area", value: form.focus },
          ],
          notes: form.notes,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.error?.message ?? "Failed to save onboarding");
        return;
      }
      setMessage("Onboarding saved");
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Core profile</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
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
        </div>
      </div>

      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Preferences</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Time zone</label>
            <input value={form.timezone} onChange={(e) => update("timezone", e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Communication style</label>
            <input
              value={form.communication}
              onChange={(e) => update("communication", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Availability</label>
            <input
              value={form.availability}
              onChange={(e) => update("availability", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus area</label>
            <input value={form.focus} onChange={(e) => update("focus", e.target.value)} className={fieldClass} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#e6e4e1] bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Additional context</p>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={4}
          placeholder="Anything Clarify should remember?"
          className={`${fieldClass} mt-3`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
        >
          {isPending ? "Saving" : "Save onboarding"}
        </button>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>
    </div>
  );
}

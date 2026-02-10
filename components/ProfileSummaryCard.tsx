import Link from "next/link";
import type { UserProfile } from "@prisma/client";

type ProfileSummaryCardProps = {
  profile: UserProfile | null;
};

const fields: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "fullName", label: "Full name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "postalCode", label: "Postal code" },
  { key: "country", label: "Country" },
  { key: "school", label: "School" },
  { key: "graduationYear", label: "Graduation year" },
  { key: "gpa", label: "GPA" },
  { key: "linkedIn", label: "LinkedIn" },
];

const getCompletion = (profile: UserProfile | null) => {
  if (!profile) return { percent: 0, missing: fields };
  const missing = fields.filter((field) => {
    const value = profile[field.key];
    return !value || (typeof value === "string" && value.trim() === "");
  });
  const percent = Math.round(((fields.length - missing.length) / fields.length) * 100);
  return { percent, missing };
};

export default function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const { percent, missing } = getCompletion(profile);
  const primaryMissing = missing.slice(0, 3).map((field) => field.label);

  return (
    <div
      data-motion="panel"
      className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Profile</p>
          <p className="text-base font-semibold text-slate-900">Auto-fill readiness</p>
        </div>
        <span className="text-xs text-slate-400">{percent}% complete</span>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-slate-900" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        {missing.length === 0 ? (
          <p>Profile complete. Auto-fill will use all common fields.</p>
        ) : (
          <p>
            Missing: {primaryMissing.join(", ")}
            {missing.length > primaryMissing.length ? "..." : ""}
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3 text-xs">
        <Link
          href="/profile"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-slate-300"
        >
          {missing.length === 0 ? "View profile" : "Complete profile"}
        </Link>
      </div>
    </div>
  );
}

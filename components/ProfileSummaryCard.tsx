import Link from "next/link";
import type { UserProfile } from "@prisma/client";
import styles from "./ProfileSummaryCard.module.css";

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
    <div data-motion="panel" className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Profile</p>
          <p className={styles.title}>Auto-fill readiness</p>
        </div>
        <span className={styles.percent}>{percent}% complete</span>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className={styles.detail}>
        {missing.length === 0 ? (
          <p>Profile complete. Auto-fill will use all common fields.</p>
        ) : (
          <p>
            Missing: {primaryMissing.join(", ")}
            {missing.length > primaryMissing.length ? "..." : ""}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <Link href="/profile" className={styles.button}>
          {missing.length === 0 ? "View profile" : "Complete profile"}
        </Link>
      </div>
    </div>
  );
}

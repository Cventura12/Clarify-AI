"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import styles from "@/app/dashboard.module.css";

type ThreadItem = {
  id: string;
  title: string;
  summary: string;
  urgency: "critical" | "high" | "medium" | "low";
  deadline: string;
  taskStatus: string;
  requestId?: string;
};

export default function DashboardRequestList({ threads }: { threads: ThreadItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const clearAll = () => {
    const confirmed = window.confirm("Clear all requests?");
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/requests", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to clear requests.");
        return;
      }
      router.refresh();
    });
  };

  const deleteOne = (requestId: string) => {
    const confirmed = window.confirm("Delete this request?");
    if (!confirmed) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/requests/${requestId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to delete request.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <div className={styles.requestActionsRow}>
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending || threads.length === 0}
          className={styles.clearAllButton}
        >
          Clear All
        </button>
      </div>

      <div className={styles.requestGrid}>
        {threads.map((item) => {
          const target = item.requestId ? `/request/${item.requestId}` : "/requests";
          return (
            <article key={item.id} data-motion="card" className={styles.requestCard}>
              <div className={styles.requestCardBody}>
                <div className={styles.requestCardMain}>
                  <Link href={target} className={styles.requestTitleLink}>
                    <p className={styles.requestCardTitle}>{item.title}</p>
                  </Link>
                  <p className={styles.requestMetaLine}>
                    <span className={styles.requestStatus}>{item.taskStatus}</span>
                    <span className={styles.requestDot}>.</span>
                    <span className={styles.requestMetaText}>{item.summary || "Awaiting next step"}</span>
                  </p>
                </div>

                <div className={styles.requestCardSide}>
                  {item.requestId ? (
                    <button
                      type="button"
                      onClick={() => deleteOne(item.requestId!)}
                      disabled={isPending}
                      className={styles.requestDeleteButton}
                      aria-label="Delete request"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 7h16" />
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        <path d="M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7" />
                      </svg>
                    </button>
                  ) : null}
                  <div className={styles.requestCardMetaRight}>
                    <span className={styles.requestDeadline}>{item.deadline}</span>
                    <span className={`${styles.requestUrgency} ${styles[`requestUrgency${item.urgency}`]}`}>
                      {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {error ? <p className={styles.requestDeleteError}>{error}</p> : null}
    </>
  );
}

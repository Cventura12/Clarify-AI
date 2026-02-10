import type { FollowUpSuggestion } from "@/lib/communications/followups";
import styles from "./NotificationPanel.module.css";

const badgeStyles: Record<string, string> = {
  follow_up: styles.badgeFollowUp,
  deadline: styles.badgeDeadline,
  blocker: styles.badgeBlocker,
  scheduled: styles.badgeScheduled,
};

const accentStyles: Record<string, string> = {
  follow_up: styles.itemFollowUp,
  deadline: styles.itemDeadline,
  blocker: styles.itemBlocker,
  scheduled: styles.itemScheduled,
};

export default function NotificationPanel({ suggestions }: { suggestions: FollowUpSuggestion[] }) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div data-motion="panel" className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>Signals</p>
          <p className={styles.panelTitle}>Needs attention</p>
        </div>
        <span className={styles.panelCount}>{suggestions.length} items</span>
      </div>

      <div className={styles.panelList}>
        {suggestions.map((item) => (
          <div
            key={item.id}
            data-signal-pulse={item.type === "blocker" || item.type === "deadline" ? "true" : "false"}
            className={`${styles.panelItem} ${accentStyles[item.type] ?? styles.itemDefault}`}
          >
            <div>
              <p className={styles.itemTitle}>{item.title}</p>
              <p className={styles.itemDetail}>{item.detail}</p>
            </div>
            <div className={styles.itemMeta}>
              <span className={`${styles.badge} ${badgeStyles[item.type] ?? styles.badgeDefault}`}>
                {item.dueLabel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

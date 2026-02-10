import type { InsightSuggestion } from "@/lib/context/suggestions";
import styles from "./InsightsPanel.module.css";

export default function InsightsPanel({ insights }: { insights: InsightSuggestion[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div data-motion="panel" className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Insights</p>
          <p className={styles.title}>Pattern suggestions</p>
        </div>
        <span className={styles.count}>{insights.length} items</span>
      </div>

      <div className={styles.list}>
        {insights.map((insight) => (
          <div key={insight.id} className={styles.item}>
            <p className={styles.itemTitle}>{insight.title}</p>
            <p className={styles.itemDetail}>{insight.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import styles from "./RunStatsCard.module.css";

type RunStatsCardProps = {
  totalRuns: number;
  executedSteps: number;
  skippedUnauthorized: number;
  skippedDependencies: number;
  lastRunAt?: Date | null;
};

export default function RunStatsCard({
  totalRuns,
  executedSteps,
  skippedUnauthorized,
  skippedDependencies,
  lastRunAt,
}: RunStatsCardProps) {
  return (
    <div data-motion="panel" className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Execution</p>
          <p className={styles.title}>Run stats</p>
          <p className={styles.subtitle}>Last 7 days</p>
        </div>
        <span className={styles.count}>{totalRuns} runs</span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricRow}>
          <span>Executed steps</span>
          <span className={styles.metricValue}>{executedSteps}</span>
        </div>
        <div className={styles.metricRow}>
          <span>Skipped (unauthorized)</span>
          <span className={styles.metricValue}>{skippedUnauthorized}</span>
        </div>
        <div className={styles.metricRow}>
          <span>Skipped (dependencies)</span>
          <span className={styles.metricValue}>{skippedDependencies}</span>
        </div>
      </div>

      <div className={styles.footer}>
        {lastRunAt ? `Last run ${lastRunAt.toLocaleString()}` : "No runs yet"}
      </div>
    </div>
  );
}

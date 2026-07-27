import styles from './ProgressBar.module.css';

export function ProgressBar({ index, total }: { index: number; total: number }) {
  const percent = ((index + 1) / total) * 100;
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${percent}%` }} />
      <span className={styles.count}>{`${index + 1} / ${total}`}</span>
    </div>
  );
}

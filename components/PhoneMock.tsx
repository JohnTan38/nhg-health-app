import Image from 'next/image';
import type { MockLine } from '@/content/types';
import styles from './PhoneMock.module.css';

function Line({ line }: { line: MockLine }) {
  switch (line.kind) {
    case 'nav':
      return (
        <div className={styles.nav}>
          {line.items.map((item) => (
            <span key={item} className={styles.navItem} data-active={String(item === line.active)}>
              {item}
            </span>
          ))}
        </div>
      );
    case 'row':
      return (
        <div className={styles.row}>
          <span className={styles.rowLabel}>{line.label}</span>
          {line.sub ? <span className={styles.rowSub}>{line.sub}</span> : null}
        </div>
      );
    case 'button':
      return (
        <span className={styles.button} data-primary={String(Boolean(line.primary))}>
          {line.label}
        </span>
      );
    case 'chips':
      return (
        <div className={styles.chips}>
          {line.items.map((item) => (
            <span key={item} className={styles.chip} data-active={String(item === line.active)}>
              {item}
            </span>
          ))}
        </div>
      );
    case 'status':
      return <span className={styles.status}>{line.label}</span>;
    case 'itinerary':
      return (
        <ol className={styles.itinerary}>
          {line.items.map((item, i) => (
            <li key={item} className={styles.stop} data-done={String(i < (line.doneCount ?? 0))}>
              {item}
            </li>
          ))}
        </ol>
      );
    case 'checkbox':
      return (
        <div className={styles.checkbox}>
          <span className={styles.tick}>✓</span>
          <span>{line.label}</span>
        </div>
      );
    case 'big':
      return <span className={styles.big}>{line.label}</span>;
    case 'qr':
      // The real QR photo already has its own border and background baked
      // in (a photographed sticker), so it renders plainly rather than
      // inside the placeholder's bordered box.
      return line.src ? (
        <Image src={line.src} alt="" width={848} height={892} className={styles.qrImage} />
      ) : (
        <div className={styles.qr}>QR CODE</div>
      );
  }
}

export function PhoneMock({ lines }: { lines: MockLine[] }) {
  return (
    <div className={styles.screen} aria-hidden="true">
      {lines.map((line, i) => (
        <Line key={`${line.kind}-${i}`} line={line} />
      ))}
    </div>
  );
}

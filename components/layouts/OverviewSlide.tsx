import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'overview' }>;

export function OverviewSlide({ body }: { body: Body }) {
  return (
    <ol className={styles.cards}>
      {body.cards.map((card) => (
        <li key={card.number} className={styles.card}>
          <span className={styles.cardNumber}>{card.number}</span>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <p className={styles.cardBody}>{card.body}</p>
        </li>
      ))}
    </ol>
  );
}

import { PhoneMock } from '../PhoneMock';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'steps' }>;

export function StepsSlide({ body }: { body: Body }) {
  return (
    <div className={styles.stepsWrap}>
      {body.callout ? (
        <aside className={styles.callout}>
          <h3 className={styles.calloutTitle}>{body.callout.title}</h3>
          <p>{body.callout.body}</p>
        </aside>
      ) : null}

      {body.stat ? (
        <aside className={styles.stat}>
          <span className={styles.statValue}>{body.stat.value}</span>
          <p>{body.stat.body}</p>
        </aside>
      ) : null}

      <ol className={styles.steps} data-lettered={String(Boolean(body.lettered))}>
        {body.steps.map((step) => (
          <li key={step.marker} className={styles.step}>
            <span className={styles.marker} aria-hidden="true">{step.marker}</span>
            {step.mockTitle ? <h3 className={styles.mockTitle}>{step.mockTitle}</h3> : null}
            <PhoneMock lines={step.mock} />
            <p className={styles.caption}>{step.caption}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

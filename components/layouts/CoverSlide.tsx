import { LogoSlot } from '../LogoSlot';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'cover' }>;

export function CoverSlide({ body }: { body: Body }) {
  return (
    <div className={styles.cover}>
      <p className={styles.coverIntro}>{body.intro}</p>
      <p className={styles.presentedBy}>Presented by</p>
      <LogoSlot src="/images/care-corner-logo.png" alt="Care Corner Singapore" fallback={body.presentedBy} />
    </div>
  );
}

import type { Slide as SlideData } from '@/content/types';
import { CoverSlide } from './layouts/CoverSlide';
import { OverviewSlide } from './layouts/OverviewSlide';
import { PracticeSlide } from './layouts/PracticeSlide';
import { StepsSlide } from './layouts/StepsSlide';
import { VideoSlide } from './layouts/VideoSlide';
import styles from './layouts/layouts.module.css';

export interface SlideProps {
  slide: SlideData;
  onInteract?: () => void;
}

export function Slide({ slide, onInteract }: SlideProps) {
  const body = slide.body;

  return (
    <section className={styles.slide} data-theme={slide.theme} aria-label={slide.label}>
      <header className={styles.header}>
        {slide.eyebrow ? <p className={styles.eyebrow}>{slide.eyebrow}</p> : null}
        <h2 className={styles.title}>{slide.title}</h2>
        {slide.lede ? <p className={styles.lede}>{slide.lede}</p> : null}
      </header>

      {body.kind === 'cover' ? <CoverSlide body={body} /> : null}
      {body.kind === 'overview' ? <OverviewSlide body={body} /> : null}
      {body.kind === 'steps' ? <StepsSlide body={body} /> : null}
      {body.kind === 'video' ? <VideoSlide body={body} onInteract={onInteract} /> : null}
      {body.kind === 'practice' ? <PracticeSlide body={body} onInteract={onInteract} /> : null}
    </section>
  );
}

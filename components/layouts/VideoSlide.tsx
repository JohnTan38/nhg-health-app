import { VideoFacade } from '../VideoFacade';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'video' }>;

export function VideoSlide({ body, onInteract }: { body: Body; onInteract?: () => void }) {
  return (
    <div className={styles.video}>
      <VideoFacade
        embedUrl={body.embedUrl}
        posterTitle={body.posterTitle}
        posterBody={body.posterBody}
        onPlay={onInteract}
      />
    </div>
  );
}

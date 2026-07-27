'use client';

import { useState } from 'react';
import styles from './VideoFacade.module.css';

export interface VideoFacadeProps {
  embedUrl: string;
  posterTitle: string;
  posterBody: string;
  onPlay?: () => void;
}

/**
 * Click-to-load wrapper for the Facebook reel. No Facebook request, script or
 * cookie is issued until the user activates it — this keeps viewers who never
 * watch untracked, and keeps the third party off the critical render path.
 */
export function VideoFacade({ embedUrl, posterTitle, posterBody, onPlay }: VideoFacadeProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <div className={styles.frame}>
        <iframe
          src={embedUrl}
          title={posterTitle}
          className={styles.iframe}
          allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div className={styles.frame}>
      <button
        type="button"
        className={styles.poster}
        onClick={() => {
          setActive(true);
          onPlay?.();
        }}
      >
        <span className={styles.playIcon} aria-hidden="true">▶</span>
        <span className={styles.posterTitle}>Play video</span>
        <span className={styles.posterBody}>{posterBody}</span>
      </button>
      <p className={styles.caption}>{posterTitle}</p>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

export interface AutoplayOptions {
  playing: boolean;
  durationMs: number;
  onAdvance: () => void;
}

/**
 * Fires `onAdvance` once every `durationMs` while `playing`.
 * The timer restarts whenever `playing` or `durationMs` changes, so a slide
 * always gets its own full reading time.
 */
export function useAutoplay({ playing, durationMs, onAdvance }: AutoplayOptions): void {
  const callback = useRef(onAdvance);

  // Keep the latest callback without making it a timer-restart dependency.
  useEffect(() => {
    callback.current = onAdvance;
  });

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => callback.current(), durationMs);
    return () => clearTimeout(id);
  }, [playing, durationMs]);
}

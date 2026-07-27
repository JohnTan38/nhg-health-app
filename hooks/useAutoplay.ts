'use client';

import { useEffect, useRef } from 'react';

export interface AutoplayOptions {
  playing: boolean;
  durationMs: number;
  /**
   * Identifies which slide `durationMs` belongs to (e.g. the slide id).
   * Consecutive slides can share a duration — several of this deck's slides
   * all clamp to the same MAX_SECONDS — so `durationMs` alone cannot signal
   * "a new slide started." Without `resetKey` the timer would silently fail
   * to re-arm on such a transition and autoplay would stall forever.
   */
  resetKey: string | number;
  onAdvance: () => void;
}

/**
 * Fires `onAdvance` once every `durationMs` while `playing`.
 * The timer restarts whenever `playing`, `durationMs`, or `resetKey` changes,
 * so a slide always gets its own full reading time.
 */
export function useAutoplay({ playing, durationMs, resetKey, onAdvance }: AutoplayOptions): void {
  const callback = useRef(onAdvance);

  // Keep the latest callback without making it a timer-restart dependency.
  useEffect(() => {
    callback.current = onAdvance;
  });

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => callback.current(), durationMs);
    return () => clearTimeout(id);
  }, [playing, durationMs, resetKey]);
}

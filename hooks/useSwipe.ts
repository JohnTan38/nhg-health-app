'use client';

import { useRef, type TouchEvent } from 'react';

const THRESHOLD_PX = 60;

export interface SwipeOptions {
  onLeft: () => void;
  onRight: () => void;
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipe({ onLeft, onRight }: SwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);

  return {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.changedTouches[0]?.clientX ?? null;
    },
    onTouchEnd: (e: TouchEvent) => {
      const from = startX.current;
      const to = e.changedTouches[0]?.clientX;
      startX.current = null;
      if (from === null || to === undefined) return;

      const dx = to - from;
      if (Math.abs(dx) < THRESHOLD_PX) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}

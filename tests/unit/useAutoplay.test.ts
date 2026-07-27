import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoplay } from '@/hooks/useAutoplay';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutoplay', () => {
  it('does not advance while paused', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: false, durationMs: 1000, resetKey: 'a', onAdvance }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('advances once per duration while playing', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: true, durationMs: 1000, resetKey: 'a', onAdvance }));
    act(() => { vi.advanceTimersByTime(999); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer when the duration changes', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      ({ durationMs }) => useAutoplay({ playing: true, durationMs, resetKey: 'a', onAdvance }),
      { initialProps: { durationMs: 1000 } },
    );
    act(() => { vi.advanceTimersByTime(900); });
    rerender({ durationMs: 2000 });
    act(() => { vi.advanceTimersByTime(1100); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(900); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  // Regression: several of this deck's real slides clamp to the same
  // MAX_SECONDS duration back-to-back (e.g. 'overview' and 'getting-started'
  // both resolve to 30000ms). If the timer only restarted on a durationMs
  // change, advancing into a same-duration slide would never re-arm it and
  // autoplay would silently stall forever.
  it('restarts the timer when resetKey changes even though duration stays the same', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      ({ resetKey }) => useAutoplay({ playing: true, durationMs: 1000, resetKey, onAdvance }),
      { initialProps: { resetKey: 'slide-1' } },
    );
    act(() => { vi.advanceTimersByTime(900); });
    // Simulates advancing to a new slide whose reading time happens to match.
    rerender({ resetKey: 'slide-2' });
    act(() => { vi.advanceTimersByTime(900); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(100); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('clears its timer on unmount', () => {
    const onAdvance = vi.fn();
    const { unmount } = renderHook(() =>
      useAutoplay({ playing: true, durationMs: 1000, resetKey: 'a', onAdvance }),
    );
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });
});

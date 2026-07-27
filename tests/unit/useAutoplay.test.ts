import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoplay } from '@/hooks/useAutoplay';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useAutoplay', () => {
  it('does not advance while paused', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: false, durationMs: 1000, onAdvance }));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('advances once per duration while playing', () => {
    const onAdvance = vi.fn();
    renderHook(() => useAutoplay({ playing: true, durationMs: 1000, onAdvance }));
    act(() => { vi.advanceTimersByTime(999); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('restarts the timer when the duration changes', () => {
    const onAdvance = vi.fn();
    const { rerender } = renderHook(
      ({ durationMs }) => useAutoplay({ playing: true, durationMs, onAdvance }),
      { initialProps: { durationMs: 1000 } },
    );
    act(() => { vi.advanceTimersByTime(900); });
    rerender({ durationMs: 2000 });
    act(() => { vi.advanceTimersByTime(1100); });
    expect(onAdvance).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(900); });
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('clears its timer on unmount', () => {
    const onAdvance = vi.fn();
    const { unmount } = renderHook(() =>
      useAutoplay({ playing: true, durationMs: 1000, onAdvance }),
    );
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onAdvance).not.toHaveBeenCalled();
  });
});

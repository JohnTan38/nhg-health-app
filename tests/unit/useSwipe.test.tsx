import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipe } from '@/hooks/useSwipe';

function Harness({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const handlers = useSwipe({ onLeft, onRight });
  return <div data-testid="stage" {...handlers}>stage</div>;
}

function swipe(from: number, to: number) {
  const stage = screen.getByTestId('stage');
  fireEvent.touchStart(stage, { changedTouches: [{ clientX: from, clientY: 0 }] });
  fireEvent.touchEnd(stage, { changedTouches: [{ clientX: to, clientY: 0 }] });
}

describe('useSwipe', () => {
  it('fires onLeft when swiping right-to-left', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(300, 100);
    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(onRight).not.toHaveBeenCalled();
  });

  it('fires onRight when swiping left-to-right', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(100, 300);
    expect(onRight).toHaveBeenCalledTimes(1);
  });

  it('ignores small movements, so a shaky hand does not change slide', () => {
    const onLeft = vi.fn();
    const onRight = vi.fn();
    render(<Harness onLeft={onLeft} onRight={onRight} />);
    swipe(200, 175);
    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
  });
});

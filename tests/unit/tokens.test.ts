import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';
import { BODY_TEXT_PAIRS, LARGE_TEXT_PAIRS, PALETTE } from '@/lib/tokens';

describe('palette', () => {
  it('exposes every token as a valid hex string', () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('body text pairs meet WCAG AA (4.5:1)', () => {
  it.each(BODY_TEXT_PAIRS)('$fg on $bg', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('large text and UI pairs meet WCAG AA (3:1)', () => {
  it.each(LARGE_TEXT_PAIRS)('$fg on $bg', ({ fg, bg }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('the accent restriction recorded in the spec', () => {
  it('care is NOT usable for body text on paper', () => {
    expect(contrastRatio(PALETTE.care, PALETTE.paper)).toBeLessThan(4.5);
  });

  it('careText IS usable for body text on paper', () => {
    expect(contrastRatio(PALETTE.careText, PALETTE.paper)).toBeGreaterThanOrEqual(4.5);
  });
});

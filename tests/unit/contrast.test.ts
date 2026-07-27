import { describe, expect, it } from 'vitest';
import { contrastRatio, relativeLuminance } from '@/lib/contrast';

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('accepts shorthand hex', () => {
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4);
  });

  it('is order independent', () => {
    expect(contrastRatio('#1d1f20', '#f2f2f3')).toBeCloseTo(
      contrastRatio('#f2f2f3', '#1d1f20'),
      6,
    );
  });

  // The measured finding recorded in the spec, locked in as a regression test.
  it('measures Care Corner orange on paper at 3.29:1', () => {
    expect(contrastRatio('#E4572E', '#f2f2f3')).toBeCloseTo(3.29, 1);
  });

  it('measures ink on paper at 14.8:1', () => {
    expect(contrastRatio('#1d1f20', '#f2f2f3')).toBeCloseTo(14.8, 1);
  });

  it('rejects malformed hex', () => {
    expect(() => relativeLuminance('nope')).toThrow(/hex/i);
  });
});

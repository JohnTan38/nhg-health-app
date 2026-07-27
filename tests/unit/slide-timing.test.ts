import { describe, expect, it } from 'vitest';
import { SLIDES } from '@/content/slides';
import { MAX_SECONDS, MIN_SECONDS, slideText, slideSeconds } from '@/lib/timing';

describe('slideText', () => {
  it('includes the title, lede and step captions', () => {
    const slide = SLIDES.find((s) => s.id === 'getting-started')!;
    const text = slideText(slide);
    expect(text).toContain('Getting started with the app');
    expect(text).toContain('Tap the big Start button.');
  });

  it('excludes speaker notes, which are narrated rather than read', () => {
    const slide = SLIDES.find((s) => s.id === 'cover')!;
    expect(slideText(slide)).not.toContain('No rush');
  });
});

describe('slideSeconds', () => {
  it('stays within bounds for every real slide', () => {
    for (const slide of SLIDES) {
      const s = slideSeconds(slide);
      expect(s, slide.id).toBeGreaterThanOrEqual(MIN_SECONDS);
      expect(s, slide.id).toBeLessThanOrEqual(MAX_SECONDS);
    }
  });

  it('gives a dense steps slide more time than the sparse cover', () => {
    const cover = SLIDES.find((s) => s.id === 'cover')!;
    const started = SLIDES.find((s) => s.id === 'getting-started')!;
    expect(slideSeconds(started)).toBeGreaterThan(slideSeconds(cover));
  });
});

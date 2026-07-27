import { describe, expect, it } from 'vitest';
import {
  MAX_SECONDS,
  MIN_SECONDS,
  countWords,
  readingSeconds,
} from '@/lib/timing';

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('collapses irregular whitespace', () => {
    expect(countWords('  one \n two \t three  ')).toBe(3);
  });

  it('is 0 for empty or blank input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('readingSeconds', () => {
  it('reads at 130 words per minute', () => {
    // 65 words = 30s at 130wpm, which is exactly the cap.
    expect(readingSeconds(65, 0)).toBe(30);
    // 26 words = 12s.
    expect(readingSeconds(26, 0)).toBe(12);
  });

  it('adds 2 seconds per step for scanning the phone mocks', () => {
    expect(readingSeconds(26, 3)).toBe(18);
  });

  it('never returns less than the minimum', () => {
    expect(readingSeconds(0, 0)).toBe(MIN_SECONDS);
    expect(readingSeconds(13, 0)).toBe(MIN_SECONDS); // raw 6s
  });

  it('never returns more than the maximum', () => {
    expect(readingSeconds(1000, 10)).toBe(MAX_SECONDS);
  });

  it('has sane bounds for an elderly audience', () => {
    expect(MIN_SECONDS).toBe(8);
    expect(MAX_SECONDS).toBe(30);
  });
});

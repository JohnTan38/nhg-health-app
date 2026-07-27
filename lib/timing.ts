/** Deliberately below conversational pace — the audience is elderly seniors. */
export const WORDS_PER_MINUTE = 130;
/** Phone mocks carry meaning but few words; allow time to scan each one. */
export const SECONDS_PER_STEP = 2;
export const MIN_SECONDS = 8;
export const MAX_SECONDS = 30;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

export function readingSeconds(words: number, stepCount: number): number {
  const raw = (words / WORDS_PER_MINUTE) * 60 + stepCount * SECONDS_PER_STEP;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(raw)));
}

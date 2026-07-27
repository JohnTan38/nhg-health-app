import type { Slide } from '@/content/types';

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

/** All text a viewer must actually read on screen. Narration is excluded. */
export function slideText(slide: Slide): string {
  const parts: string[] = [slide.eyebrow ?? '', slide.title, slide.lede ?? ''];
  const b = slide.body;

  switch (b.kind) {
    case 'cover':
      parts.push(b.intro, ...b.presentedBy);
      break;
    case 'overview':
      for (const c of b.cards) parts.push(c.title, c.body);
      break;
    case 'steps':
      if (b.callout) parts.push(b.callout.title, b.callout.body);
      if (b.stat) parts.push(b.stat.value, b.stat.body);
      for (const s of b.steps) parts.push(s.caption, s.mockTitle ?? '');
      break;
    case 'video':
      parts.push(b.posterTitle, b.posterBody);
      break;
    case 'practice':
      parts.push(...b.tasks, b.quiz.question, b.help.title, b.help.body);
      for (const o of b.quiz.options) parts.push(o.label);
      break;
  }

  return parts.filter(Boolean).join(' ');
}

export function stepCount(slide: Slide): number {
  return slide.body.kind === 'steps' ? slide.body.steps.length : 0;
}

export function slideSeconds(slide: Slide): number {
  return readingSeconds(countWords(slideText(slide)), stepCount(slide));
}

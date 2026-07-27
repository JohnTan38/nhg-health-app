import { describe, expect, it } from 'vitest';
import { SLIDES } from '@/content/slides';
import type { MockLine } from '@/content/types';

const RENDERABLE: MockLine['kind'][] = [
  'nav', 'row', 'button', 'chips', 'status', 'itinerary', 'checkbox', 'big', 'qr',
];

describe('deck integrity', () => {
  it('has exactly 11 slides', () => {
    expect(SLIDES).toHaveLength(11);
  });

  it('uses the agreed ids in the agreed order', () => {
    expect(SLIDES.map((s) => s.id)).toEqual([
      'cover', 'overview', 'getting-started', 'book-appointment',
      'register-queue', 'i-have-arrived', 'allergies', 'medications',
      'medicine-refill', 'watch-video', 'practice',
    ]);
  });

  it('numbers slides sequentially from 01', () => {
    expect(SLIDES.map((s) => s.number)).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11',
    ]);
  });

  it('gives every slide a title and a label', () => {
    for (const s of SLIDES) {
      expect(s.title.trim(), s.id).not.toBe('');
      expect(s.label.trim(), s.id).not.toBe('');
    }
  });

  it('gives every slide narration of at least 8 words', () => {
    for (const s of SLIDES) {
      expect(s.speakerNotes.trim().split(/\s+/).length, s.id).toBeGreaterThanOrEqual(8);
    }
  });

  it('gives every steps slide at least one step, each with a caption and a mock', () => {
    for (const s of SLIDES) {
      if (s.body.kind !== 'steps') continue;
      expect(s.body.steps.length, s.id).toBeGreaterThan(0);
      for (const step of s.body.steps) {
        expect(step.marker.trim(), `${s.id} marker`).not.toBe('');
        expect(step.caption.trim(), `${s.id} caption`).not.toBe('');
        expect(step.mock.length, `${s.id} mock`).toBeGreaterThan(0);
      }
    }
  });

  it('uses only renderable mock line kinds', () => {
    for (const s of SLIDES) {
      if (s.body.kind !== 'steps') continue;
      for (const step of s.body.steps) {
        for (const line of step.mock) {
          expect(RENDERABLE, `${s.id}/${step.marker}`).toContain(line.kind);
        }
      }
    }
  });

  it('marks the refill slide as lettered and uses A/B/C markers', () => {
    const refill = SLIDES.find((s) => s.id === 'medicine-refill');
    expect(refill?.body.kind).toBe('steps');
    if (refill?.body.kind !== 'steps') throw new Error('unreachable');
    expect(refill.body.lettered).toBe(true);
    expect(refill.body.steps.map((s) => s.marker)).toEqual(['A', 'B', 'C']);
  });

  it('gives the overview exactly five cards', () => {
    const overview = SLIDES.find((s) => s.id === 'overview');
    if (overview?.body.kind !== 'overview') throw new Error('unreachable');
    expect(overview.body.cards).toHaveLength(5);
  });

  it('keeps the cover intro paragraph from the source deck', () => {
    const cover = SLIDES.find((s) => s.id === 'cover');
    if (cover?.body.kind !== 'cover') throw new Error('unreachable');
    expect(cover.body.intro).toContain('all from your own phone');
  });

  it('points the video slide at the supplied Facebook reel', () => {
    const video = SLIDES.find((s) => s.id === 'watch-video');
    if (video?.body.kind !== 'video') throw new Error('unreachable');
    expect(video.body.embedUrl).toContain('facebook.com/plugins/video.php');
    expect(video.body.embedUrl).toContain('1515863629476795');
  });

  it('gives the quiz exactly one correct answer', () => {
    const practice = SLIDES.find((s) => s.id === 'practice');
    if (practice?.body.kind !== 'practice') throw new Error('unreachable');
    expect(practice.body.quiz.options.filter((o) => o.correct)).toHaveLength(1);
    expect(practice.body.quiz.options.length).toBeGreaterThanOrEqual(3);
  });

  it('preserves the Chinese example note on the medications slide', () => {
    const meds = SLIDES.find((s) => s.id === 'medications');
    if (meds?.body.kind !== 'steps') throw new Error('unreachable');
    expect(JSON.stringify(meds)).toContain('白色药丸');
  });

  it('points the getting-started QR step at the real app-download QR photo', () => {
    const started = SLIDES.find((s) => s.id === 'getting-started');
    if (started?.body.kind !== 'steps') throw new Error('unreachable');
    const qrStep = started.body.steps[0];
    const qrLine = qrStep?.mock[0];
    expect(qrLine?.kind).toBe('qr');
    if (qrLine?.kind !== 'qr') throw new Error('unreachable');
    expect(qrLine.src).toBe('/images/nhg-health-qr-code.png');
  });
});

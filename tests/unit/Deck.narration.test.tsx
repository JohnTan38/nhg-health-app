import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SpeechOutcome } from '@/lib/speech';

// `useSpeech` is replaced wholesale so the tests can decide exactly when an
// utterance ends — the real hook resolves on a browser event jsdom never
// fires. The stub object is created once and reused, matching the real hook's
// stable identity so the deck's effects don't re-subscribe on every render.
const { speak, cancel, speechStub } = vi.hoisted(() => {
  const speakFn = vi.fn();
  const cancelFn = vi.fn();
  return {
    speak: speakFn,
    cancel: cancelFn,
    speechStub: { supported: true, speaking: false, speak: speakFn, cancel: cancelFn },
  };
});

vi.mock('@/hooks/useSpeech', () => ({ useSpeech: () => speechStub }));

import { Deck } from '@/components/Deck';
import { SLIDES } from '@/content/slides';
import { slideSeconds } from '@/lib/timing';

/** Mirrors the breathing gap the deck leaves after an utterance. */
const BREATH_MS = 1200;

const FIRST = SLIDES[0]!;
const SECOND = SLIDES[1]!;
const FIRST_DURATION_MS = slideSeconds(FIRST) * 1000;

/** Resolves the in-flight utterance, standing in for the browser's `onend`. */
let endUtterance: (outcome: SpeechOutcome) => void = () => {};

function currentTitle(): string {
  return screen.getByRole('heading', { level: 2 }).textContent ?? '';
}

/** Turns narration on, then starts playback — the deck opens paused and mute. */
function startNarratedPlayback(): void {
  fireEvent.click(screen.getByRole('button', { name: /read slides aloud/i }));
  fireEvent.click(screen.getByRole('button', { name: /play slideshow/i }));
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('Deck narration pacing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    speak.mockReset();
    cancel.mockReset();
    speak.mockImplementation(
      () =>
        new Promise<SpeechOutcome>((resolve) => {
          endUtterance = resolve;
        }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('narrates the current slide when playback starts with the voice on', () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();
    expect(speak).toHaveBeenCalledWith(FIRST.speakerNotes);
  });

  it('waits out the rest of the reading time plus a breath after speech ends', async () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();

    // A short utterance leaves nearly the whole reading budget outstanding.
    await act(async () => endUtterance('ended'));

    await advance(FIRST_DURATION_MS + BREATH_MS - 50);
    expect(currentTitle()).toContain(FIRST.title);

    await advance(100);
    expect(currentTitle()).toContain(SECOND.title);
  });

  it('never advances mid-sentence, even once the reading time is spent', async () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();

    // Still speaking well past the reading budget: the slide must hold.
    await advance(FIRST_DURATION_MS * 3);
    expect(currentTitle()).toContain(FIRST.title);

    await act(async () => endUtterance('ended'));
    await advance(BREATH_MS + 50);
    expect(currentTitle()).toContain(SECOND.title);
  });

  it('leaves no pending advance behind when paused mid-slide', async () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();
    await act(async () => endUtterance('ended'));

    // Pause after the advance is scheduled but before it comes due.
    await advance(500);
    fireEvent.keyDown(window, { key: 'p' });
    expect(cancel).toHaveBeenCalled();

    await advance(120_000);
    expect(currentTitle()).toContain(FIRST.title);
  });

  it('cancels the utterance when narration is switched off mid-sentence', async () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();
    await advance(500);

    cancel.mockClear();
    fireEvent.keyDown(window, { key: 'v' });

    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /read slides aloud/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('pauses and falls silent when the tab is hidden', async () => {
    render(<Deck slides={SLIDES} />);
    startNarratedPlayback();
    cancel.mockClear();

    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));

    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument();
    hidden.mockRestore();
  });

  it('uses the plain timer, and never speaks, while the voice is off', async () => {
    render(<Deck slides={SLIDES} />);
    fireEvent.click(screen.getByRole('button', { name: /play slideshow/i }));

    expect(speak).not.toHaveBeenCalled();

    await advance(FIRST_DURATION_MS + 50);
    expect(currentTitle()).toContain(SECOND.title);
  });
});

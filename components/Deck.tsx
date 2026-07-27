'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Slide as SlideData } from '@/content/types';
import { useAutoplay } from '@/hooks/useAutoplay';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useSpeech } from '@/hooks/useSpeech';
import { useSwipe } from '@/hooks/useSwipe';
import { slideSeconds } from '@/lib/timing';
import { Controls } from './Controls';
import { ProgressBar } from './ProgressBar';
import { Slide } from './Slide';
import { SpeakerNotes } from './SpeakerNotes';
import styles from './Deck.module.css';

const BREATH_MS = 1200;

/** Typing here must never reach the deck's shortcuts. */
const TEXT_ENTRY_TAGS = /^(INPUT|TEXTAREA|SELECT)$/;
/** Controls that answer to Space or Enter on their own. */
const SELF_ACTIVATING_TAGS = /^(BUTTON|A)$/;
const NAV_KEYS = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Home', 'End'];

export function Deck({ slides }: { slides: SlideData[] }) {
  const [index, setIndex] = useState(0);
  // Starts paused: a deck that talks or moves by itself is disruptive in a
  // group room, and iOS will not produce audio without a gesture anyway.
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const speech = useSpeech();
  const slide = slides[index]!;

  const goTo = useCallback(
    (next: number) => setIndex(Math.min(slides.length - 1, Math.max(0, next))),
    [slides.length],
  );

  const pause = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Manual navigation always pauses — nobody should be hurried.
  const manualNext = useCallback(() => { pause(); next(); }, [pause, next]);
  const manualPrev = useCallback(() => { pause(); prev(); }, [pause, prev]);

  const durationMs = useMemo(() => slideSeconds(slide) * 1000, [slide]);

  useAutoplay({
    playing: playing && !voiceOn,
    durationMs,
    onAdvance: () => (index < slides.length - 1 ? next() : setPlaying(false)),
  });

  // With narration on, the slide never advances mid-sentence, and never
  // faster than the reading time.
  useEffect(() => {
    if (!playing || !voiceOn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();

    void speech.speak(slide.speakerNotes).then(() => {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, durationMs - elapsed);
      timer = setTimeout(() => {
        if (cancelled) return;
        if (index < slides.length - 1) next();
        else setPlaying(false);
      }, remaining + BREATH_MS);
    });

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      speech.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, voiceOn, index, durationMs]);

  // Never keep talking or advancing into a hidden tab.
  useEffect(() => {
    const onHide = (): void => {
      if (document.hidden) { setPlaying(false); speech.cancel(); }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [speech]);

  const toggleVoice = useCallback(() => {
    setVoiceOn((v) => !v);
    speech.cancel();
  }, [speech]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      // Never hijack typing in a form control.
      const tag = (e.target as HTMLElement | null)?.tagName ?? '';
      if (TEXT_ENTRY_TAGS.test(tag)) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      // The deck-wide toggles stay available wherever focus sits: someone who
      // just clicked Play should be able to press P again without tabbing away
      // first, and no control claims a bare letter key for itself.
      if (key === 'p' || key === 'v') {
        e.preventDefault();
        if (key === 'p') setPlaying((p) => !p);
        else toggleVoice();
        return;
      }

      if (!NAV_KEYS.includes(key)) return;

      // Space is the one navigation key a focused button or link answers to
      // itself. Swallowing it would page the deck instead of pressing the
      // control the user had deliberately tabbed to, so let the control win.
      // The rest (arrows, Page keys, Home/End) mean nothing to a button, so
      // deck navigation still works from anywhere.
      if (key === ' ' && SELF_ACTIVATING_TAGS.test(tag)) return;
      e.preventDefault();

      if (key === 'ArrowRight' || key === ' ' || key === 'PageDown') manualNext();
      else if (key === 'ArrowLeft' || key === 'PageUp') manualPrev();
      else if (key === 'Home') { pause(); goTo(0); }
      else if (key === 'End') { pause(); goTo(slides.length - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [manualNext, manualPrev, pause, goTo, slides.length, toggleVoice]);

  const swipe = useSwipe({ onLeft: manualNext, onRight: manualPrev });

  return (
    <main className={styles.deck} aria-label="NHG Health App guide">
      <ProgressBar index={index} total={slides.length} />

      <div className={styles.stage} data-reduced={String(reducedMotion)} {...swipe}>
        <div key={slide.id} className={styles.layer}>
          <Slide slide={slide} onInteract={pause} />
        </div>
      </div>

      <p role="status" aria-live="polite" className={styles.srOnly}>
        {`Slide ${index + 1} of ${slides.length}: ${slide.label}`}
      </p>

      <SpeakerNotes notes={slide.speakerNotes} visible={captionsOn} />

      <Controls
        playing={playing}
        voiceOn={voiceOn}
        voiceSupported={speech.supported}
        captionsOn={captionsOn}
        onTogglePlay={() => setPlaying((p) => !p)}
        onToggleVoice={toggleVoice}
        onToggleCaptions={() => setCaptionsOn((c) => !c)}
        onPrev={manualPrev}
        onNext={manualNext}
      />
    </main>
  );
}

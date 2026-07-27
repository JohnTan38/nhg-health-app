export type SpeechOutcome = 'ended' | 'watchdog' | 'cancelled' | 'unsupported' | 'error';

/** Rough spoken pace, used only to size the watchdog. */
const SPOKEN_WPM = 150;
const WATCHDOG_HEADROOM = 1.5;
const WATCHDOG_FLOOR_MS = 5_000;

export function isSpeechSupported(): boolean {
  return (
    typeof globalThis.speechSynthesis !== 'undefined' &&
    typeof globalThis.SpeechSynthesisUtterance !== 'undefined'
  );
}

export function estimatedSpeechMs(wordCount: number): number {
  return (wordCount / SPOKEN_WPM) * 60_000;
}

export function watchdogMs(wordCount: number): number {
  return estimatedSpeechMs(wordCount) * WATCHDOG_HEADROOM + WATCHDOG_FLOOR_MS;
}

export interface Speaker {
  speak(text: string): Promise<SpeechOutcome>;
  cancel(): void;
}

export function createSpeaker(): Speaker {
  let settle: ((o: SpeechOutcome) => void) | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (outcome: SpeechOutcome): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    const s = settle;
    settle = null;
    s?.(outcome);
  };

  return {
    speak(text: string): Promise<SpeechOutcome> {
      if (!isSpeechSupported()) return Promise.resolve('unsupported');

      // A previous utterance must never leak its resolution into this one.
      finish('cancelled');
      globalThis.speechSynthesis.cancel();

      return new Promise<SpeechOutcome>((resolve) => {
        settle = resolve;
        const utterance = new globalThis.SpeechSynthesisUtterance(text);
        utterance.lang = 'en-SG';
        // Slower than default: the audience is elderly seniors.
        utterance.rate = 0.9;
        utterance.onend = () => finish('ended');
        utterance.onerror = () => finish('error');

        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        timer = setTimeout(() => finish('watchdog'), watchdogMs(words));

        globalThis.speechSynthesis.speak(utterance);
      });
    },

    cancel(): void {
      finish('cancelled');
      if (isSpeechSupported()) globalThis.speechSynthesis.cancel();
    },
  };
}

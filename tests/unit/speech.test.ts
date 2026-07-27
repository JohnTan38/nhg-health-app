import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpeaker, isSpeechSupported, watchdogMs } from '@/lib/speech';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function installFakeSpeech(opts: { fireEnd: boolean }) {
  const spoken: FakeUtterance[] = [];
  const synth = {
    speak: (u: FakeUtterance) => {
      spoken.push(u);
      if (opts.fireEnd) queueMicrotask(() => u.onend?.());
    },
    cancel: vi.fn(),
    getVoices: () => [],
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return { spoken, synth };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('isSpeechSupported', () => {
  it('is false when the API is absent', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(isSpeechSupported()).toBe(false);
  });

  it('is true when the API is present', () => {
    installFakeSpeech({ fireEnd: true });
    expect(isSpeechSupported()).toBe(true);
  });
});

describe('watchdogMs', () => {
  it('scales with utterance length and adds headroom', () => {
    expect(watchdogMs(0)).toBeGreaterThanOrEqual(5000);
    expect(watchdogMs(100)).toBeGreaterThan(watchdogMs(10));
  });
});

describe('createSpeaker', () => {
  it('resolves when onend fires', async () => {
    installFakeSpeech({ fireEnd: true });
    const speaker = createSpeaker();
    const done = speaker.speak('hello there everyone');
    await vi.advanceTimersByTimeAsync(0);
    await expect(done).resolves.toBe('ended');
  });

  it('resolves via the watchdog when onend never fires', async () => {
    installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    const done = speaker.speak('hello there everyone');
    await vi.advanceTimersByTimeAsync(120_000);
    await expect(done).resolves.toBe('watchdog');
  });

  it('resolves immediately when speech is unsupported', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const speaker = createSpeaker();
    await expect(speaker.speak('anything')).resolves.toBe('unsupported');
  });

  it('cancel is safe to call repeatedly and when idle', () => {
    const { synth } = installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    expect(() => {
      speaker.cancel();
      speaker.cancel();
    }).not.toThrow();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('cancelling a pending utterance resolves it as cancelled', async () => {
    installFakeSpeech({ fireEnd: false });
    const speaker = createSpeaker();
    const done = speaker.speak('a long sentence that never ends');
    speaker.cancel();
    await expect(done).resolves.toBe('cancelled');
  });
});

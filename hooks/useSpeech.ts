'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSpeaker, isSpeechSupported, type SpeechOutcome } from '@/lib/speech';

export interface UseSpeech {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => Promise<SpeechOutcome>;
  cancel: () => void;
}

export function useSpeech(): UseSpeech {
  const speakerRef = useRef<ReturnType<typeof createSpeaker> | null>(null);
  const [speaking, setSpeaking] = useState(false);
  // Feature detection is a pure, static read of a browser global — no effect needed.
  const supported = isSpeechSupported();

  useEffect(() => {
    speakerRef.current = createSpeaker();
    return () => speakerRef.current?.cancel();
  }, []);

  const speak = useCallback(async (text: string): Promise<SpeechOutcome> => {
    const speaker = speakerRef.current;
    if (!speaker) return 'unsupported';
    setSpeaking(true);
    try {
      return await speaker.speak(text);
    } finally {
      setSpeaking(false);
    }
  }, []);

  const cancel = useCallback(() => {
    speakerRef.current?.cancel();
    setSpeaking(false);
  }, []);

  return useMemo(
    () => ({ supported, speaking, speak, cancel }),
    [supported, speaking, speak, cancel],
  );
}

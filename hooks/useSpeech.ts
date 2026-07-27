'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createSpeaker, isSpeechSupported, type SpeechOutcome } from '@/lib/speech';

export interface UseSpeech {
  supported: boolean;
  speaking: boolean;
  speak: (text: string) => Promise<SpeechOutcome>;
  cancel: () => void;
}

// The app builds fully static, so this client component still gets one
// server-rendered pass before hydration. `speechSynthesis` doesn't exist in
// Node, so a plain `isSpeechSupported()` read during render would say `false`
// on the server and (usually) `true` on the client's first render — a
// hydration mismatch. `useSyncExternalStore` with a server snapshot avoids
// that by making the server/first-client-render value explicit and
// consistent; the API's presence never changes over a session, so `subscribe`
// has nothing to listen for and is a no-op.
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  return isSpeechSupported();
}

function getServerSnapshot(): boolean {
  return false;
}

export function useSpeech(): UseSpeech {
  const speakerRef = useRef<ReturnType<typeof createSpeaker> | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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

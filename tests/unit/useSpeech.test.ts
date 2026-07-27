import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from '@/hooks/useSpeech';

afterEach(() => vi.unstubAllGlobals());

describe('useSpeech', () => {
  it('does not throw when speechSynthesis is absent', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    expect(() => renderHook(() => useSpeech())).not.toThrow();
  });

  it('reports supported: false when the API is absent', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeech());
    expect(result.current.supported).toBe(false);
  });

  it('reports supported: true when the API is present', () => {
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: () => [],
    });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    const { result } = renderHook(() => useSpeech());
    expect(result.current.supported).toBe(true);
  });
});

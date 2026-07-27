import styles from './Controls.module.css';

export interface ControlsProps {
  playing: boolean;
  voiceOn: boolean;
  voiceSupported: boolean;
  captionsOn: boolean;
  onTogglePlay: () => void;
  onToggleVoice: () => void;
  onToggleCaptions: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Controls({
  playing, voiceOn, voiceSupported, captionsOn,
  onTogglePlay, onToggleVoice, onToggleCaptions, onPrev, onNext,
}: ControlsProps) {
  return (
    <div className={styles.bar}>
      <button type="button" className={styles.btn} onClick={onPrev} aria-label="Previous slide">←</button>
      <button type="button" className={styles.btn} onClick={onTogglePlay}
        aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <button type="button" className={styles.btn} onClick={onNext} aria-label="Next slide">→</button>

      {voiceSupported ? (
        <button type="button" className={styles.btn} onClick={onToggleVoice}
          aria-pressed={voiceOn} aria-label="Read slides aloud">
          {voiceOn ? '🔊' : '🔇'}
        </button>
      ) : null}

      <button type="button" className={styles.btn} onClick={onToggleCaptions}
        aria-pressed={captionsOn} aria-label="Show narration text">CC</button>

      <a className={styles.btn} href="/docs/nhg-health-digital-education.pdf"
        download aria-label="Download the guide as PDF">⤓ PDF</a>
    </div>
  );
}

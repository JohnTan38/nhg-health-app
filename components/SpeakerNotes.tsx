import styles from './SpeakerNotes.module.css';

export function SpeakerNotes({ notes, visible }: { notes: string; visible: boolean }) {
  return (
    <p className={styles.notes} data-visible={String(visible)}>
      {notes}
    </p>
  );
}

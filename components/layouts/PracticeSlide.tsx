import { Quiz } from '../Quiz';
import type { SlideBody } from '@/content/types';
import styles from './layouts.module.css';

type Body = Extract<SlideBody, { kind: 'practice' }>;

export function PracticeSlide({ body, onInteract }: { body: Body; onInteract?: () => void }) {
  return (
    <div className={styles.practice}>
      <ol className={styles.tasks}>
        {body.tasks.map((task) => (
          <li key={task} className={styles.task}>{task}</li>
        ))}
      </ol>

      <div className={styles.practiceAside}>
        <Quiz quiz={body.quiz} onInteract={onInteract} />
        <aside className={styles.callout}>
          <h3 className={styles.calloutTitle}>{body.help.title}</h3>
          <p>{body.help.body}</p>
        </aside>
      </div>
    </div>
  );
}

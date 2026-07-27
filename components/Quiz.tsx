'use client';

import { useState } from 'react';
import type { Quiz as QuizData } from '@/content/types';
import styles from './Quiz.module.css';

export interface QuizProps {
  quiz: QuizData;
  onInteract?: () => void;
}

type Result = 'none' | 'correct' | 'retry';

export function Quiz({ quiz, onInteract }: QuizProps) {
  const [result, setResult] = useState<Result>('none');

  const answer = (correct: boolean): void => {
    onInteract?.();
    setResult(correct ? 'correct' : 'retry');
  };

  return (
    <div className={styles.quiz}>
      <p className={styles.question}>{quiz.question}</p>
      <div className={styles.options}>
        {quiz.options.map((o) => (
          <button
            key={o.label}
            type="button"
            className={styles.option}
            onClick={() => answer(o.correct)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className={styles.feedback} data-result={result}>
        {result === 'correct' ? quiz.correctFeedback : result === 'retry' ? quiz.retryFeedback : ''}
      </p>
    </div>
  );
}

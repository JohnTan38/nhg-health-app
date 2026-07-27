import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Quiz } from '@/components/Quiz';
import type { Quiz as QuizData } from '@/content/types';

const quiz: QuizData = {
  question: 'How many minutes before your appointment can you tap "I have arrived"?',
  options: [
    { label: '10', correct: false },
    { label: '30', correct: true },
    { label: '60', correct: false },
  ],
  correctFeedback: 'That is right — 30 minutes before your appointment.',
  retryFeedback: 'Not quite. Have another look, then try again.',
};

describe('Quiz', () => {
  it('renders every option as a real button', () => {
    render(<Quiz quiz={quiz} />);
    for (const o of quiz.options) {
      expect(screen.getByRole('button', { name: o.label })).toBeInTheDocument();
    }
  });

  it('confirms a correct answer', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(quiz.correctFeedback)).toBeInTheDocument();
  });

  it('invites another try after a wrong answer, without locking out', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByText(quiz.retryFeedback)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(quiz.correctFeedback)).toBeInTheDocument();
  });

  it('announces feedback politely to assistive tech', async () => {
    const user = userEvent.setup();
    render(<Quiz quiz={quiz} />);
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByRole('status')).toHaveTextContent(quiz.correctFeedback);
  });

  it('pauses autoplay on first interaction', async () => {
    const user = userEvent.setup();
    const onInteract = vi.fn();
    render(<Quiz quiz={quiz} onInteract={onInteract} />);
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(onInteract).toHaveBeenCalled();
  });
});

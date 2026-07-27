import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Slide } from '@/components/Slide';
import { SLIDES } from '@/content/slides';

describe('Slide', () => {
  it.each(SLIDES.map((s) => [s.id, s] as const))('renders %s without throwing', (_id, slide) => {
    render(<Slide slide={slide} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(slide.title);
  });

  it('applies the slide theme as a data attribute', () => {
    const cover = SLIDES.find((s) => s.id === 'cover')!;
    const { container } = render(<Slide slide={cover} />);
    expect(container.firstElementChild).toHaveAttribute('data-theme', 'dark');
  });

  it('renders every step caption on a steps slide', () => {
    const slide = SLIDES.find((s) => s.id === 'getting-started')!;
    if (slide.body.kind !== 'steps') throw new Error('unreachable');
    render(<Slide slide={slide} />);
    for (const step of slide.body.steps) {
      expect(screen.getByText(step.caption)).toBeInTheDocument();
    }
  });
});

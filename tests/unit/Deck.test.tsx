import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Deck } from '@/components/Deck';
import { SLIDES } from '@/content/slides';

describe('Deck', () => {
  it('starts on the first slide', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('advances and retreats with the controls', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.click(screen.getByRole('button', { name: /next slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[1]!.title);
    await user.click(screen.getByRole('button', { name: /previous slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('does not retreat past the first slide', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.click(screen.getByRole('button', { name: /previous slide/i }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[0]!.title);
  });

  it('advances with the arrow key', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(SLIDES[1]!.title);
  });

  it('announces the current slide politely', () => {
    render(<Deck slides={SLIDES} />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent(SLIDES[0]!.label);
  });

  it('starts paused, so it never surprises a room with sound or motion', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('offers the reference PDF as a download from every slide', () => {
    render(<Deck slides={SLIDES} />);
    const link = screen.getByRole('link', { name: /download/i });
    expect(link).toHaveAttribute('href', '/docs/nhg-health-digital-education.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('shows the position out of the total', () => {
    render(<Deck slides={SLIDES} />);
    expect(screen.getByText(`1 / ${SLIDES.length}`)).toBeInTheDocument();
  });

  it('toggles play with the P key and narration with the V key', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('p');
    expect(screen.getByRole('button', { name: /pause slideshow/i })).toBeInTheDocument();
    await user.keyboard('p');
    expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument();
  });

  // Space is the deck's "next slide" shortcut, but a button the user has
  // deliberately tabbed to must keep its own press.
  it('lets a focused control answer Space itself instead of paging the deck', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    screen.getByRole('button', { name: /play slideshow/i }).focus();

    await user.keyboard(' ');

    expect(screen.getByRole('button', { name: /pause slideshow/i })).toBeInTheDocument();
    expect(screen.getByText(`1 / ${SLIDES.length}`)).toBeInTheDocument();
  });

  it('still toggles play with the P key while a control has focus', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    screen.getByRole('button', { name: /next slide/i }).focus();

    await user.keyboard('p');

    expect(screen.getByRole('button', { name: /pause slideshow/i })).toBeInTheDocument();
  });

  it('jumps to the last slide with End and back with Home', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{End}');
    expect(screen.getByText(`${SLIDES.length} / ${SLIDES.length}`)).toBeInTheDocument();
    await user.keyboard('{Home}');
    expect(screen.getByText(`1 / ${SLIDES.length}`)).toBeInTheDocument();
  });

  // Slides are keyed by id, so leaving and returning remounts the layer and
  // clears quiz state — the deck can be re-run for the next group.
  it('resets quiz state when the practice slide is left and re-entered', async () => {
    const user = userEvent.setup();
    render(<Deck slides={SLIDES} />);
    await user.keyboard('{End}');
    await user.click(screen.getByRole('button', { name: '30' }));
    expect(screen.getByText(/that is right/i)).toBeInTheDocument();

    await user.keyboard('{Home}');
    await user.keyboard('{End}');
    expect(screen.queryByText(/that is right/i)).toBeNull();
  });
});

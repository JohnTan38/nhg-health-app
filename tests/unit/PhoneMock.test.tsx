import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhoneMock } from '@/components/PhoneMock';
import type { MockLine } from '@/content/types';

describe('PhoneMock', () => {
  it('renders nav items and marks the active one', () => {
    const lines: MockLine[] = [
      { kind: 'nav', items: ['Home', 'Appointments', 'Payments'], active: 'Appointments' },
    ];
    render(<PhoneMock lines={lines} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText('Payments')).toHaveAttribute('data-active', 'false');
  });

  it('renders a row with its sub-label', () => {
    render(<PhoneMock lines={[{ kind: 'row', label: 'Metformin 500mg', sub: 'Twice daily' }]} />);
    expect(screen.getByText('Metformin 500mg')).toBeInTheDocument();
    expect(screen.getByText('Twice daily')).toBeInTheDocument();
  });

  it('renders mock buttons as inert, not as real buttons', () => {
    render(<PhoneMock lines={[{ kind: 'button', label: 'Submit', primary: true }]} />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    // These are pictures of buttons. A screen reader user must not be offered them.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('marks completed itinerary stops', () => {
    render(
      <PhoneMock
        lines={[{ kind: 'itinerary', items: ['Registration', 'Consultation', 'Pharmacy'], doneCount: 1 }]}
      />,
    );
    expect(screen.getByText('Registration')).toHaveAttribute('data-done', 'true');
    expect(screen.getByText('Consultation')).toHaveAttribute('data-done', 'false');
  });

  it('renders the whole mock as a single decorative image to assistive tech', () => {
    const { container } = render(<PhoneMock lines={[{ kind: 'qr' }]} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('falls back to the placeholder box when a qr line has no src', () => {
    const { container } = render(<PhoneMock lines={[{ kind: 'qr' }]} />);
    expect(screen.getByText('QR CODE')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the real QR photo instead of the placeholder when src is supplied', () => {
    const { container } = render(
      <PhoneMock lines={[{ kind: 'qr', src: '/images/nhg-health-qr-code.png' }]} />,
    );
    expect(screen.queryByText('QR CODE')).toBeNull();
    // Decorative (alt=""), so it has no accessible "img" role -- query the
    // element directly rather than via getByRole.
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
  });
});

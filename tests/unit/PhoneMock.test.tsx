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
});

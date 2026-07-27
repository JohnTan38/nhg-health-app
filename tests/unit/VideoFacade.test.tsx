import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { VideoFacade } from '@/components/VideoFacade';

const props = {
  embedUrl: 'https://www.facebook.com/plugins/video.php?href=x',
  posterTitle: 'Watch: using the NHG Health App',
  posterBody: 'Tap to play.',
};

describe('VideoFacade', () => {
  it('renders no iframe before activation', () => {
    const { container } = render(<VideoFacade {...props} />);
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('Watch: using the NHG Health App')).toBeInTheDocument();
  });

  it('exposes a large, clearly named play control', () => {
    render(<VideoFacade {...props} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('injects the iframe only after the user activates it', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoFacade {...props} />);
    await user.click(screen.getByRole('button', { name: /play/i }));
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe(props.embedUrl);
  });

  it('notifies the deck when playback starts so autoplay can pause', async () => {
    const user = userEvent.setup();
    let started = false;
    render(<VideoFacade {...props} onPlay={() => { started = true; }} />);
    await user.click(screen.getByRole('button', { name: /play/i }));
    expect(started).toBe(true);
  });
});

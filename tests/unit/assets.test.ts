import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('static assets', () => {
  it('ships the reference PDF at the path the download control uses', () => {
    const path = 'public/docs/nhg-health-digital-education.pdf';
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(10_000);
  });

  it('ships the Care Corner logo at the path the cover slide uses', () => {
    const path = 'public/images/care-corner-logo.png';
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(1_000);
  });

  it('ships the app-download QR code at the path the getting-started slide uses', () => {
    const path = 'public/images/nhg-health-qr-code.png';
    expect(existsSync(path)).toBe(true);
    expect(statSync(path).size).toBeGreaterThan(1_000);
  });
});

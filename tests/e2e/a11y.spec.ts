import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * The whole deck is client-side, so the server-rendered HTML is inert until
 * React hydrates: a click or keypress landing before then is simply lost. The
 * voice toggle is the one control that cannot exist server-side (it renders
 * only once `speechSynthesis` is detected on the client), which makes it an
 * exact "the deck is now listening" marker.
 */
async function waitForHydration(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /read slides aloud/i })).toBeVisible();
}

/**
 * Each slide fades in over `--fade-ms`. Scanning mid-fade measures a transient
 * frame — axe blends every foreground colour against the background by the
 * layer's current opacity and reports ~1:1 contrast for text that is perfectly
 * legible a moment later. Wait for the slide the viewer actually reads.
 */
async function settleOnSlide(page: Page, oneBased: number): Promise<void> {
  await expect(page.getByText(`${oneBased} / 11`, { exact: true })).toBeVisible();
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== 'running'),
  );
}

test('every slide passes an automated accessibility scan', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  for (let i = 0; i < 11; i += 1) {
    // Also proves the scan really is running once per slide state, not 11
    // times on whichever slide a dropped click left us on.
    await settleOnSlide(page, i + 1);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations, `slide ${i + 1}: ${JSON.stringify(results.violations.map((v) => v.id))}`)
      .toEqual([]);

    if (i < 10) await page.getByRole('button', { name: /next slide/i }).click();
  }
});

test('all controls are reachable by keyboard', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);

  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('2 / 11', { exact: true })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByText('1 / 11', { exact: true })).toBeVisible();
  await page.keyboard.press('End');
  await expect(page.getByText('11 / 11', { exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(page.getByText('1 / 11', { exact: true })).toBeVisible();
});

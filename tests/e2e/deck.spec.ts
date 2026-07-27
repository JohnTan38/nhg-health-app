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

test('reaches the last slide through the controls', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('NHG Health App');

  for (let i = 0; i < 10; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await expect(page.getByText('11 / 11', { exact: true })).toBeVisible();
});

test('autoplay advances, and no faster than the reading time', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page.getByRole('button', { name: /play slideshow/i }).click();

  // The cover's reading time floors at 8s, so at 3s it must still be slide 1.
  await page.waitForTimeout(3000);
  await expect(page.getByText('1 / 11', { exact: true })).toBeVisible();

  await expect(page.getByText('2 / 11', { exact: true })).toBeVisible({ timeout: 30_000 });
});

test('manual navigation pauses autoplay', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  await page.getByRole('button', { name: /play slideshow/i }).click();
  await page.getByRole('button', { name: /next slide/i }).click();
  await expect(page.getByRole('button', { name: /play slideshow/i })).toBeVisible();
});

test('the video slide issues no Facebook request until activated', async ({ page }) => {
  const facebookRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('facebook.com')) facebookRequests.push(r.url());
  });

  await page.goto('/');
  await waitForHydration(page);
  for (let i = 0; i < 9; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await expect(page.getByRole('button', { name: /play video/i })).toBeVisible();
  expect(facebookRequests, 'no third-party request before consent').toHaveLength(0);

  await page.getByRole('button', { name: /play video/i }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
});

test('the quiz gives feedback', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  for (let i = 0; i < 10; i += 1) {
    await page.getByRole('button', { name: /next slide/i }).click();
  }
  await page.getByRole('button', { name: '30', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /that is right/i })).toBeVisible();
});

test('the PDF is downloadable', async ({ page, request }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /download/i });
  const href = await link.getAttribute('href');
  expect(href).toBe('/docs/nhg-health-digital-education.pdf');

  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('pdf');
});

test('body text is never smaller than 18px', async ({ page }) => {
  await page.goto('/');
  await waitForHydration(page);
  for (let i = 0; i < 11; i += 1) {
    await expect(page.getByText(`${i + 1} / 11`, { exact: true })).toBeVisible();

    const tooSmall = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll('p, li, span, h2, h3, button, a')) {
        if (!el.textContent?.trim()) continue;
        if (el.closest('[aria-hidden="true"]')) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < 18) bad.push(`${el.tagName}:${size}px:${el.textContent.slice(0, 30)}`);
      }
      return bad;
    });
    expect(tooSmall, `slide ${i + 1}`).toEqual([]);
    if (i < 10) await page.getByRole('button', { name: /next slide/i }).click();
  }
});

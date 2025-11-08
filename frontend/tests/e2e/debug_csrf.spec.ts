import { test } from '@playwright/test';

// Focused diagnostic test to inspect XSRF cookie and refresh endpoint behavior
test('debug: inspect cookies and refresh endpoint', async ({ page }) => {
  // Load the app root so any auth cookie logic runs
  await page.goto('/');

  // Print document.cookie to Playwright output
  const cookies = await page.evaluate(() => document.cookie);
  // eslint-disable-next-line no-console
  console.log('document.cookie:', cookies);

  // Try calling the refresh endpoint without any headers (browser will include cookies)
  const respNoHeader = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
      const text = await r.text();
      return { status: r.status, body: text, headers: Array.from(r.headers.entries()) };
    } catch (e) {
      return { error: String(e) };
    }
  });
  // eslint-disable-next-line no-console
  console.log('refresh without X-XSRF-TOKEN:', respNoHeader);

  // If an XSRF token cookie exists, read it and send it as header
  const respWithHeader = await page.evaluate(async () => {
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
        return '';
      };
      const xsrf = getCookie('XSRF-TOKEN');
      const r = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: xsrf ? { 'X-XSRF-TOKEN': xsrf } : {},
      });
      const text = await r.text();
      return { status: r.status, body: text, headers: Array.from(r.headers.entries()) };
    } catch (e) {
      return { error: String(e) };
    }
  });
  // eslint-disable-next-line no-console
  console.log('refresh with X-XSRF-TOKEN header:', respWithHeader);
});

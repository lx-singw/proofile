import { test } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_URL ?? process.env.BACKEND_URL ?? 'http://backend:8000';

test('debug: perform login and inspect cookies', async ({ page, request }) => {
  const email = `debug-user-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = 'SuperSecret123!';

  // Seed via API so the UI login can succeed. Use the provided request fixture.
  const resp = await request.post(`${API_BASE_URL}/api/v1/users`, {
    data: { email, password, full_name: 'Playwright Debug' },
    failOnStatusCode: false,
  });
  // ignore errors if already exists

  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // submit and wait for token request
  await Promise.all([
    page.waitForResponse((r: any) => r.url().includes('/api/v1/auth/token') && r.status() >= 200 && r.status() < 300),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  // After login, dump document.cookie
  const cookies = await page.evaluate(() => document.cookie);
  // eslint-disable-next-line no-console
  console.log('after-login document.cookie:', cookies);

  // Try refresh from the page (should succeed if cookies and header are set)
  const refreshResp = await page.evaluate(async () => {
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
      return { status: r.status, body: text };
    } catch (e) {
      return { error: String(e) };
    }
  });
  // eslint-disable-next-line no-console
  console.log('after-login refresh result:', refreshResp);

  // no apiContext to dispose when using the shared request fixture
});

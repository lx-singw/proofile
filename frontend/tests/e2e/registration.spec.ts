import { test, expect } from '@playwright/test';

async function gotoWithRetry(page: any, url: string, attempts = 3) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const status = resp?.status() ?? 200;
      if (status < 500) return resp;
    } catch (e) {
      lastErr = e;
    }
    await page.waitForTimeout(500);
  }
  if (lastErr) throw lastErr;
}

// Helper to generate unique emails per run
const uniqueEmail = () => `user_${Date.now()}_${Math.floor(Math.random()*1000)}@example.com`;

test.beforeEach(async ({ page }) => {
  page.on('request', req => {
    // Log method + URL path to help triage
    try { const u = new URL(req.url()); console.log('[request]', req.method(), u.pathname); }
    catch { console.log('[request]', req.method(), req.url()); }
  });
  page.on('response', async res => {
    try { const u = new URL(res.url()); console.log('[response]', res.status(), u.pathname); }
    catch { console.log('[response]', res.status(), res.url()); }
  });
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
});

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Log network and console to help triage API issues
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        console.log('[request]', req.method(), req.url());
      }
    });
    page.on('response', async (res) => {
      if (res.url().includes('/api/')) {
        const status = res.status();
        let bodyPreview = '';
        try {
          const text = await res.text();
          bodyPreview = text?.slice(0, 300) || '';
        } catch {}
        console.log('[response]', status, res.url(), bodyPreview);
      }
    });
    page.on('requestfailed', (req) => {
      if (req.url().includes('/api/')) {
        console.log('[requestfailed]', req.method(), req.url(), req.failure());
      }
    });
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log('[console]', type, msg.text());
      }
    });
    page.on('pageerror', (err) => {
      console.log('[pageerror]', err.message);
    });
  });
  test('shows validation errors on empty submit', async ({ page }) => {
  await gotoWithRetry(page, '/register');
    await page.getByRole('button', { name: /create account/i }).click();
    // Email field error
    const emailError = await page.getByText(/please enter a valid email address/i);
    await expect(emailError).toBeVisible();
    // Password error
    const passwordError = await page.getByText(/password must be at least 8 characters/i);
    await expect(passwordError).toBeVisible();
  });

  test('successful registration redirects to login', async ({ page }) => {
    const email = uniqueEmail();
  await gotoWithRetry(page, '/register');
    await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('SuperSecret123!');
    const [resp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/v1/users') && r.status() >= 200 && r.status() < 300),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    expect(resp.status()).toBeGreaterThanOrEqual(200);
    expect(resp.status()).toBeLessThan(300);
    // Wait for navigation to /login (client-side route push)
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/login$/);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('duplicate email shows error without redirect', async ({ page }) => {
    const email = uniqueEmail();
    // First registration succeeds
  await gotoWithRetry(page, '/register');
    await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('SuperSecret123!');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/v1/users') && r.status() >= 200 && r.status() < 300),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/login$/);

    // Second registration (duplicate) should fail and stay on /register
    await page.goto('/register');
    await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill('SuperSecret123!');
    const [dupResp] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/v1/users') && r.status() >= 400),
      page.getByRole('button', { name: /create account/i }).click(),
    ]);
    expect(dupResp.status()).toBeGreaterThanOrEqual(400);
    // Ensure we did not redirect to /login
    await expect(page).toHaveURL(/\/register$/);
    // Look for any error text surfaced
    const errText = page.getByText(/already|exists|error|failed|invalid/i).first();
    await expect(errText).toBeVisible({ timeout: 10000 });
  });
});

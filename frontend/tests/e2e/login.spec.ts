import { test, expect, request as playwrightRequest } from '@playwright/test';

const gotoWithRetry = async (page: any, url: string, attempts = 3) => {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const status = resp?.status() ?? 200;
      if (status < 500) return resp;
    } catch (err) {
      lastErr = err;
    }
    await page.waitForTimeout(500);
  }
  if (lastErr) throw lastErr;
  return undefined;
};

// In CI / docker environment the backend is reachable at the service name 'backend'.
// Allow overriding via E2E_API_URL for local runs.
const API_BASE_URL = process.env.E2E_API_URL ?? process.env.BACKEND_URL ?? 'http://backend:8000';

const ensureTestUser = async (email: string, password:string) => {
  const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  const response = await apiContext.post('/api/v1/users', {
    data: {
      email,
      password,
      full_name: 'Playwright Login Seed',
    },
    failOnStatusCode: false,
  });

  if (response.ok()) {
    await apiContext.dispose();
    return;
  }

  const status = response.status();
  if (status === 400) {
    const body = await response.json().catch(() => ({}));
    const detail = body?.detail;
    if (typeof detail === 'string' && detail.toLowerCase().includes('already exists')) {
      await apiContext.dispose();
      return;
    }
  }

  const bodyText = await response.text();
  await apiContext.dispose();
  throw new Error(`Failed to seed login user (${status}): ${bodyText}`);
};

const authenticateForApi = async (email: string, password: string) => {
  const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const loginResp = await apiContext.post('/api/v1/auth/token', {
      form: {
        username: email,
        password,
      },
      failOnStatusCode: false,
    });

    if (loginResp.status() === 429 && attempt < maxAttempts) {
      const retryAfter = Number(loginResp.headers()['retry-after'] ?? '1');
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 1000));
      continue;
    }

    if (!loginResp.ok()) {
      const status = loginResp.status();
      const bodyText = await loginResp.text();
      await apiContext.dispose();
      throw new Error(`Failed to authenticate test user (${status}): ${bodyText}`);
    }

    const json = await loginResp.json();
    const accessToken = json?.access_token;
    if (!accessToken) {
      await apiContext.dispose();
      throw new Error('Auth token not returned when seeding login test');
    }

    return { apiContext, accessToken };
  }

  await apiContext.dispose();
  throw new Error('Exceeded retry attempts when authenticating login test user');
};

const seedProfileForUser = async (email: string, password: string) => {
  const { apiContext, accessToken } = await authenticateForApi(email, password);

  const profileResp = await apiContext.post('/api/v1/profiles', {
    data: {
      headline: 'Playwright Test User',
      summary: 'Profile seeded for Playwright login flow tests.',
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    failOnStatusCode: false,
  });

  if (!profileResp.ok() && profileResp.status() !== 409) {
    const status = profileResp.status();
    const bodyText = await profileResp.text();
    await apiContext.dispose();
    throw new Error(`Failed to seed profile for login test user (${status}): ${bodyText}`);
  }

  await apiContext.dispose();
};

const UNIQUE_PREFIX = () => Math.random().toString(36).slice(2, 8);

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    page.on('console', (msg) => {
      try {
        console.log('[page.console]', msg.type(), msg.text());
      } catch (e) {
        // ignore
      }
    });
    page.on('request', (req) => {
      if (req.url().includes('/api/')) {
        console.log('[request]', req.method(), req.url());
      }
    });
    page.on('response', async (res) => {
      if (res.url().includes('/api/')) {
        let preview = '';
        try {
          preview = await res.text();
        } catch {
          preview = '';
        }
        console.log('[response]', res.status(), res.url(), preview.slice(0, 300));
        // Also print Set-Cookie headers for auth endpoints to help debug cookie setting
        try {
          const headers = res.headers();
          if (res.url().includes('/api/v1/auth/token') || res.url().includes('/api/v1/auth/refresh')) {
            console.log('[response-headers]', res.url(), headers['set-cookie'] ?? headers);
          }
        } catch (e) {
          // ignore
        }
      }
    });
  });

  test('shows error for incorrect password', async ({ page }) => {
    const email = `login-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureTestUser(email, password);

    await gotoWithRetry(page, '/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill('WrongPassword123!');
    await Promise.all([
      page.waitForResponse((r: any) => r.url().includes('/api/v1/auth/token') && r.status() >= 400),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);
    await expect(page.getByText(/invalid email or password/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('redirects to dashboard on successful login', async ({ page }) => {
    const email = `login-success-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureTestUser(email, password);
    await seedProfileForUser(email, password);

    await gotoWithRetry(page, '/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await Promise.all([
      page.waitForResponse((r: any) => r.url().includes('/api/v1/auth/token') && r.status() >= 200 && r.status() < 300),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByTestId('dashboard-user')).toContainText(email);
  });

  test('persists session after refresh', async ({ page }) => {
    const email = `login-refresh-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureTestUser(email, password);
    await seedProfileForUser(email, password);

    await gotoWithRetry(page, '/login');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await Promise.all([
      page.waitForResponse((r: any) => r.url().includes('/api/v1/auth/token') && r.status() >= 200 && r.status() < 300),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.url(), { timeout: 15000 }).toMatch(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-user')).toContainText(email);
  });
});

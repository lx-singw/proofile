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

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://backend:8000';
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const authTokenCache = new Map<string, { token: string; createdAt: number }>();

const ensureProfileTestUser = async (email: string, password: string) => {
  const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  const createResp = await apiContext.post('/api/v1/users', {
    data: {
      email,
      password,
      full_name: 'Playwright Profile Seed',
    },
    failOnStatusCode: false,
  });

  if (!createResp.ok()) {
    const status = createResp.status();
    if (status !== 400) {
      const bodyText = await createResp.text();
      await apiContext.dispose();
      throw new Error(`Failed to seed profile user (${status}): ${bodyText}`);
    }
  }

  await apiContext.dispose();
};

const authenticateForApi = async (email: string, password: string) => {
  const cached = authTokenCache.get(email);
  if (cached && Date.now() - cached.createdAt < TOKEN_CACHE_TTL_MS) {
    const cachedContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
    return { apiContext: cachedContext, accessToken: cached.token };
  }

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
      throw new Error('Auth token not returned when seeding profile');
    }

    authTokenCache.set(email, { token: accessToken, createdAt: Date.now() });
    return { apiContext, accessToken };
  }

  await apiContext.dispose();
  throw new Error('Exceeded retry attempts when authenticating test user');
};

const seedProfileForUser = async (
  email: string,
  password: string,
  profile: { headline: string; summary: string }
) => {
  const { apiContext, accessToken } = await authenticateForApi(email, password);

  const profileResp = await apiContext.post('/api/v1/profiles', {
    data: profile,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    failOnStatusCode: false,
  });

  if (!profileResp.ok() && profileResp.status() !== 409) {
    const status = profileResp.status();
    const bodyText = await profileResp.text();
    await apiContext.dispose();
    throw new Error(`Failed to seed profile (${status}): ${bodyText}`);
  }

  await apiContext.dispose();
};

const loginViaApi = async (page: any, email: string, password: string) => {
  const { apiContext, accessToken } = await authenticateForApi(email, password);
  await apiContext.dispose();

  await gotoWithRetry(page, '/login');
  await page.evaluate((token: string) => {
    window.localStorage.setItem('auth:accessToken', token);
  }, accessToken);
  await page.reload({ waitUntil: 'domcontentloaded' });
};

const UNIQUE_PREFIX = () => Math.random().toString(36).slice(2, 10);

test.describe('Profile Flow', () => {
  test.describe.configure({ timeout: 120000 });

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await gotoWithRetry(page, '/login');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('redirects new user to profile creation', async ({ page }) => {
    const email = `profile-create-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/dashboard');
    await expect(page).toHaveURL(/\/profile\/create(?:\/|$)/, { timeout: 30000 });
    await expect(page.getByTestId('create-profile-heading')).toBeVisible({ timeout: 30000 });
  });

  test('allows submitting a new profile', async ({ page }) => {
    const email = `profile-submit-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile/create');
    await expect(page).toHaveURL(/\/profile\/create(?:\/|$)/, { timeout: 30000 });

    await page.fill('[data-testid="headline"]', 'New Profile User');
    await page.fill('[data-testid="summary"]', 'Future builder.');

    await Promise.all([
      page.waitForResponse(
        (r: any) =>
          r.url().includes('/api/v1/profiles') &&
          r.request().method() === 'POST' &&
          r.status() >= 200 &&
          r.status() < 400
      ),
      page.getByTestId('submit-profile').click(),
    ]);

    await expect(page.getByTestId('profile-success')).toContainText('Profile created for New Profile User', {
      timeout: 15000,
    });
    await gotoWithRetry(page, '/profile');
    await expect(page.getByTestId('profile-headline')).toHaveText('New Profile User', { timeout: 30000 });
    await expect(page.getByTestId('profile-summary')).toContainText('Future builder.', { timeout: 30000 });
  });

  test('surfaces existing profile details', async ({ page }) => {
    const email = `profile-view-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);
    await seedProfileForUser(email, password, {
      headline: 'Playwright View User',
      summary: 'Curious lifelong learner',
    });

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile');
    await expect(page).toHaveURL(/\/profile(?:\/|$)/, { timeout: 30000 });
    await expect(page.getByTestId('profile-headline')).toHaveText('Playwright View User', { timeout: 30000 });
    await expect(page.getByTestId('profile-summary')).toContainText('Curious lifelong learner', {
      timeout: 30000,
    });
  });

  test('updates profile fields via edit form', async ({ page }) => {
    const email = `profile-edit-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);
    await seedProfileForUser(email, password, {
      headline: 'Profile Editor',
      summary: 'Ready to improve',
    });

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile/edit');
    await expect(page.getByTestId('save-profile')).toBeVisible({ timeout: 15000 });

    await page.fill('[data-testid="edit_headline"]', 'Profile Editor Updated');
    await page.fill('[data-testid="edit_summary"]', 'Updated summary from Playwright.');

    await Promise.all([
      page.waitForResponse(
        (r: any) =>
          r.url().includes('/api/v1/profiles/') &&
          r.request().method() === 'PATCH' &&
          r.status() >= 200 &&
          r.status() < 400
      ),
      page.getByTestId('save-profile').click(),
    ]);

    await gotoWithRetry(page, '/profile');
    await expect(page.getByTestId('profile-headline')).toHaveText('Profile Editor Updated', { timeout: 30000 });
    await expect(page.getByTestId('profile-summary')).toContainText('Updated summary from Playwright.', {
      timeout: 30000,
    });
  });

  test('allows uploading an avatar', async ({ page }) => {
    const email = `profile-avatar-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile/create');
    await expect(page).toHaveURL(/\/profile\/create(?:\/|$)/, { timeout: 30000 });

    // Fill out form and attach a file
    await page.fill('[data-testid="headline"]', 'Avatar User');
    await page.fill('[data-testid="summary"]', 'I have a shiny new avatar.');

    // Use setInputFiles to simulate file upload.
    // We create a fake file in-memory for the test.
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      ),
    });

    // Wait for the avatar preview to appear
    await expect(page.getByTestId('avatar-preview')).toBeVisible({ timeout: 15000 });

    await Promise.all([
      // Wait for both the profile creation and the avatar upload API calls
      page.waitForResponse((r) => r.url().includes('/api/v1/profiles') && r.request().method() === 'POST'),
      page.waitForResponse((r) => r.url().includes('/api/v1/profiles/avatar') && r.request().method() === 'POST'),
      page.getByTestId('submit-profile').click(),
    ]);

    // Verify on the profile view page
    await gotoWithRetry(page, '/profile');
    const avatarImage = page.getByTestId('profile-avatar');
    await expect(avatarImage).toBeVisible({ timeout: 30000 });
    await expect(avatarImage).toHaveAttribute('src', /.+/); // Check that src is not empty
  });
});

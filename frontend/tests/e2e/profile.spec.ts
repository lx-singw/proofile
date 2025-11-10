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
const NAVIGATION_TIMEOUT = 60_000;
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

const registerUserViaUi = async (
  page: any,
  {
    email,
    password,
    fullName = 'Playwright Onboarding',
  }: { email: string; password: string; fullName?: string }
) => {
  await gotoWithRetry(page, '/register');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible({ timeout: 20000 });
  await page.getByLabel(/^email$/i).fill(email);
  const fullNameInput = page.getByLabel(/full name/i);
  if ((await fullNameInput.count()) > 0) {
    await fullNameInput.fill(fullName);
  }
  await page.getByLabel(/^password$/i).fill(password);

  const [resp] = await Promise.all([
    page.waitForResponse(
      (response: any) =>
        response.url().includes('/api/v1/users') &&
        response.request().method() === 'POST' &&
        response.status() >= 200 &&
        response.status() < 400
    ),
    page.getByRole('button', { name: /create account/i }).click(),
  ]);
  expect(resp.status()).toBeGreaterThanOrEqual(200);
  expect(resp.status()).toBeLessThan(400);

  await page.waitForURL(/\/login(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/login(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
};

const loginUserViaUi = async (page: any, { email, password }: { email: string; password: string }) => {
  await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 20000 });
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);

  await Promise.all([
    page.waitForResponse(
      (response: any) =>
        response.url().includes('/api/v1/auth/token') &&
        response.request().method() === 'POST' &&
        response.status() >= 200 &&
        response.status() < 400
    ),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  await page.waitForURL(/\/dashboard(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page).toHaveURL(/\/dashboard(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await page.waitForTimeout(500);
  const cookieSnapshot = await page.evaluate(() => document.cookie);
  // eslint-disable-next-line no-console
  console.log('[loginUserViaUi] cookies:', cookieSnapshot);
  await expect(page.getByTestId('profile-status-banner')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
};

const createProfileViaUi = async (
  page: any,
  { headline, summary }: { headline: string; summary: string }
) => {
  await expect(page).toHaveURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await page.fill('[data-testid="headline"]', headline);
  await page.fill('[data-testid="summary"]', summary);

  const [createResponse] = await Promise.all([
    page.waitForResponse(
      (response: any) =>
        response.url().includes('/api/v1/profiles') &&
        response.request().method() === 'POST' &&
        response.status() >= 200 &&
        response.status() < 400
    ),
    page.getByTestId('submit-profile').click(),
  ]);

  expect(createResponse.status()).toBeGreaterThanOrEqual(200);
  expect(createResponse.status()).toBeLessThan(400);

  await page.waitForURL(/\/profile(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByTestId('profile-headline')).toHaveText(headline, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByTestId('profile-summary')).toContainText(summary, { timeout: NAVIGATION_TIMEOUT });
};

const editProfileViaUi = async (
  page: any,
  { headline, summary }: { headline: string; summary: string }
) => {
  await page.getByTestId('profile-edit').click();
  await page.waitForURL(/\/profile\/edit(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  const headlineInput = page.getByTestId('edit_headline');
  const summaryInput = page.getByTestId('edit_summary');

  await headlineInput.fill(headline);
  await summaryInput.fill(summary);

  const [updateResponse] = await Promise.all([
    page.waitForResponse(
      (response: any) =>
        response.url().includes('/api/v1/profiles/') &&
        response.request().method() === 'PATCH' &&
        response.status() >= 200 &&
        response.status() < 400
    ),
    page.getByTestId('save-profile').click(),
  ]);

  expect(updateResponse.status()).toBeGreaterThanOrEqual(200);
  expect(updateResponse.status()).toBeLessThan(400);

  await page.waitForURL(/\/profile(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByTestId('profile-headline')).toHaveText(headline, { timeout: NAVIGATION_TIMEOUT });
  await expect(page.getByTestId('profile-summary')).toContainText(summary, { timeout: NAVIGATION_TIMEOUT });
};

test.describe('Registration to Profile Flow', () => {
  test.describe.configure({ timeout: 180000 });

  test.beforeEach(async ({ page }) => {
    page.on('response', async (res) => {
      if (!res.url().includes('/api/')) return;
      // eslint-disable-next-line no-console
      console.log('[api-response]', res.status(), res.url());
    });
    page.on('console', (msg) => {
      // eslint-disable-next-line no-console
      console.log('[console]', msg.type(), msg.text());
    });
  });

  test('registers a new user and creates a profile via the UI', async ({ page }) => {
    const email = `profile-onboard-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    const headline = `Playwright Headline ${UNIQUE_PREFIX()}`;
    const summary = 'Playwright user ready for opportunities.';

    await registerUserViaUi(page, { email, password });
    await loginUserViaUi(page, { email, password });
    await Promise.all([
      page.waitForURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT }),
      page.getByRole('link', { name: /create professional profile/i }).click(),
    ]);
    await createProfileViaUi(page, { headline, summary });
    await expect(page.getByTestId('profile-edit')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
  });

  test('registers, creates, and edits a profile through the UI', async ({ page }) => {
    const email = `profile-edit-flow-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    const initialHeadline = `Initial Headline ${UNIQUE_PREFIX()}`;
    const initialSummary = 'Creating profile to verify edit surface.';
    const updatedHeadline = `Updated Headline ${UNIQUE_PREFIX()}`;
    const updatedSummary = 'Updated summary authored during Playwright run.';

    await registerUserViaUi(page, { email, password });
    await loginUserViaUi(page, { email, password });
    await Promise.all([
      page.waitForURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT }),
      page.getByRole('link', { name: /create professional profile/i }).click(),
    ]);
    await createProfileViaUi(page, { headline: initialHeadline, summary: initialSummary });
    await editProfileViaUi(page, { headline: updatedHeadline, summary: updatedSummary });
  });
});

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

  test('shows profile banner and allows navigation to profile creation', async ({ page }) => {
    const email = `profile-create-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-status-banner')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await Promise.all([
      page.waitForURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT }),
      page.getByRole('link', { name: /create professional profile/i }).click(),
    ]);
    await expect(page.getByTestId('create-profile-heading')).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
  });

  test('allows submitting a new profile', async ({ page }) => {
    const email = `profile-submit-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    const headline = 'New Profile User';
    const summary = 'Future builder.';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile/create');
    await expect(page).toHaveURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });

    await page.fill('[data-testid="headline"]', headline);
    await page.fill('[data-testid="summary"]', summary);

    await Promise.all([
      page.waitForResponse(
        (response: any) =>
          response.url().includes('/api/v1/profiles') &&
          response.request().method() === 'POST' &&
          response.status() >= 200 &&
          response.status() < 400
      ),
      page.getByTestId('submit-profile').click(),
    ]);

    await expect(page.getByTestId('profile-success')).toContainText(
      `Profile created for ${headline}`,
      { timeout: NAVIGATION_TIMEOUT }
    );
    await gotoWithRetry(page, '/profile');
    await expect(page).toHaveURL(/\/profile(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-headline')).toHaveText(headline, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-summary')).toContainText(summary, { timeout: NAVIGATION_TIMEOUT });
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
    await expect(page).toHaveURL(/\/profile(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-headline')).toHaveText('Playwright View User', { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-summary')).toContainText('Curious lifelong learner', {
      timeout: NAVIGATION_TIMEOUT,
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
    await expect(page.getByTestId('profile-headline')).toHaveText('Profile Editor Updated', { timeout: NAVIGATION_TIMEOUT });
    await expect(page.getByTestId('profile-summary')).toContainText('Updated summary from Playwright.', {
      timeout: NAVIGATION_TIMEOUT,
    });
  });

  test('allows uploading an avatar', async ({ page }) => {
    const email = `profile-avatar-${UNIQUE_PREFIX()}@example.com`;
    const password = 'SuperSecret123!';
    await ensureProfileTestUser(email, password);

    await loginViaApi(page, email, password);
    await gotoWithRetry(page, '/profile/create');
    await expect(page).toHaveURL(/\/profile\/create(?:\/?|$)/, { timeout: NAVIGATION_TIMEOUT });

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
    await expect(avatarImage).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await expect(avatarImage).toHaveAttribute('src', /.+/); // Check that src is not empty
  });
});

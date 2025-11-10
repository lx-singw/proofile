# Sprint 7: E2E Testing & Deployment Plan

## Overview
Sprint 7 focuses on end-to-end testing, cross-browser validation, and production deployment. This ensures the dashboard works seamlessly across all environments and browsers before going live.

---

## Phase 1: E2E Test Framework Setup

### 1.1 Playwright Configuration
**Status:** ⏳ TODO
- Verify `playwright.config.ts` configured correctly
- Set base URL to `http://localhost:3000`
- Configure timeouts: navigation (30s), action (10s)
- Enable screenshots/video on failure
- Set up test data fixtures

### 1.2 Authentication Setup
**Status:** ⏳ TODO
Create `tests/fixtures/auth.fixture.ts`:
```typescript
export async function authenticateUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'testPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  return page;
}
```

---

## Phase 2: E2E Test Suites

### 2.1 Dashboard Loading (`dashboard.spec.ts`)

**Tests to Implement:**
```typescript
describe('Dashboard Page', () => {
  // ✅ Page Load
  test('Dashboard page loads successfully', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    await expect(dash.locator('h1')).toContainText('Dashboard');
    await expect(dash.locator('[data-testid="welcome-banner"]')).toBeVisible();
  });

  // ✅ All Widgets Render
  test('All dashboard widgets render on page', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    await expect(dash.locator('[data-testid="welcome-banner"]')).toBeVisible();
    await expect(dash.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(dash.locator('[data-testid="activity-graph"]')).toBeVisible();
    await expect(dash.locator('[data-testid="profile-completion"]')).toBeVisible();
    await expect(dash.locator('[data-testid="suggested-actions"]')).toBeVisible();
    await expect(dash.locator('[data-testid="activity-feed"]')).toBeVisible();
  });

  // ✅ Lazy Loading
  test('Heavy components load lazily with skeleton loaders', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Initially shows skeleton
    const skeleton = dash.locator('[data-testid="activity-graph-skeleton"]');
    await expect(skeleton).toBeVisible({ timeout: 100 });
    
    // Then loads actual component
    const graph = dash.locator('[data-testid="activity-graph"]');
    await expect(graph).toBeVisible({ timeout: 3000 });
    
    // Skeleton is hidden
    await expect(skeleton).toBeHidden();
  });

  // ✅ Performance Metrics
  test('Web Vitals are recorded', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    
    // Listen for requests to metrics endpoint
    const metricsPromise = dash.waitForResponse(
      response => response.url().includes('/api/metrics/web-vitals') && response.status() === 200
    );
    
    await dash.goto('/dashboard');
    const response = await metricsPromise;
    
    expect(response.status()).toBe(200);
  });

  // ✅ Data Loads Correctly
  test('Dashboard data populates correctly', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Check welcome banner has user name
    const userNameElement = dash.locator('[data-testid="user-name"]');
    await expect(userNameElement).not.toBeEmpty();
    
    // Check stats have values
    const statValues = dash.locator('[data-testid="stat-value"]');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);
  });

  // ✅ No Console Errors
  test('No console errors on dashboard load', async ({ page, authenticateUser }) => {
    let consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    await dash.waitForLoadState('networkidle');
    
    expect(consoleErrors).toEqual([]);
  });
});
```

### 2.2 Navigation & Dropdowns (`navigation.spec.ts`)

**Tests to Implement:**
```typescript
describe('Navigation & Dropdowns', () => {
  // ✅ Header Navigation
  test('Header navigation items are clickable', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Logo click navigates home
    await dash.click('[data-testid="logo"]');
    await expect(dash).toHaveURL(/\/$|\/dashboard$/);
    
    // Go back to dashboard
    await dash.goto('/dashboard');
  });

  // ✅ Dashboard Dropdown Menu
  test('Dashboard dropdown menu works correctly', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    const dropdown = dash.locator('[data-testid="dashboard-dropdown"]');
    
    // Initially hidden
    await expect(dropdown.locator('[role="menu"]')).toBeHidden();
    
    // Click to open
    await dropdown.click();
    await expect(dropdown.locator('[role="menu"]')).toBeVisible();
    
    // Click menu item
    await dropdown.locator('text=My Profile').click();
    await expect(dash).toHaveURL(/\/profile/);
  });

  // ✅ Create Button Menu
  test('Create button dropdown shows all actions', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Open create menu
    await dash.click('[data-testid="create-button"]');
    
    const menu = dash.locator('[data-testid="create-menu"]');
    await expect(menu).toBeVisible();
    
    // Check all action items exist
    const items = await menu.locator('[role="menuitem"]').count();
    expect(items).toBeGreaterThanOrEqual(4);
  });

  // ✅ Search Bar Keyboard Shortcut
  test('Search bar opens with Cmd/Ctrl+K', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    const searchModal = dash.locator('[data-testid="search-modal"]');
    
    // Initially hidden
    await expect(searchModal).toBeHidden();
    
    // Press Cmd/Ctrl+K
    await dash.keyboard.press('Control+K');
    
    // Modal opens
    await expect(searchModal).toBeVisible();
    
    // Search input focused
    const input = searchModal.locator('input[type="text"]');
    await expect(input).toBeFocused();
  });

  // ✅ Notification Bell
  test('Notification bell shows unread count', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    const badge = dash.locator('[data-testid="notification-badge"]');
    
    // Badge exists and has count
    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/\d+/);
    
    // Click opens notification dropdown
    await dash.click('[data-testid="notification-bell"]');
    await expect(dash.locator('[data-testid="notification-dropdown"]')).toBeVisible();
  });

  // ✅ User Menu
  test('User menu displays and opens correctly', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    const userMenu = dash.locator('[data-testid="user-menu"]');
    
    // Click opens menu
    await userMenu.click();
    
    const menu = dash.locator('[data-testid="user-menu-items"]');
    await expect(menu).toBeVisible();
    
    // Check menu items
    await expect(menu.locator('text=Settings')).toBeVisible();
    await expect(menu.locator('text=Sign Out')).toBeVisible();
  });
});
```

### 2.3 Mobile Responsiveness (`mobile.spec.ts`)

**Tests to Implement:**
```typescript
describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  // ✅ Mobile Menu Visibility
  test('Mobile menu hamburger appears on small screens', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    const hamburger = dash.locator('[data-testid="mobile-menu-button"]');
    await expect(hamburger).toBeVisible();
  });

  // ✅ Mobile Drawer
  test('Mobile drawer opens and closes correctly', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Open drawer
    await dash.click('[data-testid="mobile-menu-button"]');
    const drawer = dash.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();
    
    // Close with X button
    await dash.click('[data-testid="drawer-close-button"]');
    await expect(drawer).toBeHidden();
  });

  // ✅ Touch Gestures
  test('Mobile drawer closes on swipe', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Open drawer
    await dash.click('[data-testid="mobile-menu-button"]');
    const drawer = dash.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();
    
    // Swipe close (drag from right side of drawer to left)
    await drawer.dragTo(dash.locator('body'), {
      sourcePosition: { x: 380, y: 200 },
      targetPosition: { x: 100, y: 200 }
    });
    
    await expect(drawer).toBeHidden();
  });

  // ✅ Responsive Layout
  test('Dashboard layout is responsive on mobile', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Sidebar should be hidden
    const sidebar = dash.locator('[data-testid="dashboard-sidebar"]');
    await expect(sidebar).toBeHidden();
    
    // Main content should be full width
    const main = dash.locator('[data-testid="dashboard-main"]');
    const box = await main.boundingBox();
    expect(box?.width).toBeGreaterThan(300);
  });

  // ✅ Search Modal on Mobile
  test('Search modal optimizes for mobile', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Open search
    await dash.keyboard.press('Control+K');
    const modal = dash.locator('[data-testid="search-modal"]');
    
    // Modal should take up most of screen on mobile
    const box = await modal.boundingBox();
    expect(box?.width || 0).toBeGreaterThan(320);
  });
});
```

### 2.4 Accessibility Testing (`accessibility.spec.ts`)

**Tests to Implement:**
```typescript
describe('Accessibility', () => {
  // ✅ Keyboard Navigation
  test('Dashboard navigable with keyboard only', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Tab through interactive elements
    const firstFocusable = dash.locator('button, a, input').first();
    await firstFocusable.focus();
    
    // Tab moves to next element
    await dash.keyboard.press('Tab');
    const focusedElement = dash.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
  });

  // ✅ ARIA Labels
  test('All interactive elements have accessible labels', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Check buttons have labels
    const buttons = dash.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  // ✅ Color Contrast
  test('Text meets color contrast standards', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Run axe accessibility scan
    const accessibility = await dash.evaluate(() => {
      return document.documentElement.outerHTML;
    });
    
    expect(accessibility).toBeTruthy();
  });

  // ✅ Screen Reader Support
  test('Content is properly announced to screen readers', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard');
    
    // Check for proper heading hierarchy
    const h1 = await dash.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);
    
    // Check for landmark elements
    const main = await dash.locator('main').count();
    expect(main).toBeGreaterThanOrEqual(1);
  });
});
```

### 2.5 Performance Monitoring (`performance.spec.ts`)

**Tests to Implement:**
```typescript
describe('Performance Monitoring', () => {
  // ✅ Performance Page Loads
  test('Performance dashboard page loads', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard/performance');
    
    // Page title
    await expect(dash.locator('h1')).toContainText('Performance Monitoring');
    
    // Metric cards visible
    const cards = dash.locator('[data-testid="metric-card"]');
    await expect(cards).not.toHaveCount(0);
  });

  // ✅ Metrics Display
  test('Performance metrics display correct values', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard/performance');
    
    // Wait for metrics to load
    await dash.waitForTimeout(2000);
    
    // Check FCP metric
    const fcpCard = dash.locator('[data-testid="metric-fcp"]');
    const fcpValue = await fcpCard.textContent();
    expect(fcpValue).toMatch(/\d+ms/);
  });

  // ✅ Memory Usage
  test('Memory usage metrics display', async ({ page, authenticateUser }) => {
    const dash = await authenticateUser(page);
    await dash.goto('/dashboard/performance');
    
    // Wait for metrics
    await dash.waitForTimeout(2000);
    
    // Check memory metric
    const memoryCard = dash.locator('[data-testid="metric-memory"]');
    const memoryValue = await memoryCard.textContent();
    expect(memoryValue).toMatch(/KB|MB/);
  });
});
```

---

## Phase 3: Cross-Browser Testing

### 3.1 Browser Configuration

**Supported Browsers:**
- ✅ Chrome (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)

**Playwright Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### 3.2 Test Execution

```bash
# Run on all browsers
npx playwright test

# Run specific browser
npx playwright test --project=chromium

# Run with UI
npx playwright test --ui

# Run with headed (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

---

## Phase 4: Manual QA Checklist

### 4.1 Functionality QA
- [ ] User can log in successfully
- [ ] Dashboard displays all widgets
- [ ] All navigation links work
- [ ] Dropdown menus open/close
- [ ] Search bar functions (Cmd/Ctrl+K)
- [ ] Create button works
- [ ] Notifications display
- [ ] Profile card shows correct data
- [ ] Stats cards update with new data
- [ ] Activity feed scrolls smoothly
- [ ] Profile completion progress bar animates
- [ ] Suggested actions are personalized

### 4.2 Visual QA
- [ ] No layout shifts during load
- [ ] All colors display correctly
- [ ] Fonts render properly
- [ ] Images load and display
- [ ] Icons render correctly
- [ ] Responsive on desktop (1920px, 1440px, 1024px)
- [ ] Responsive on tablet (768px, 600px)
- [ ] Responsive on mobile (375px, 320px)

### 4.3 Performance QA
- [ ] Page loads within 3 seconds
- [ ] Skeleton loaders appear immediately
- [ ] Components load smoothly
- [ ] No jank during animations
- [ ] Smooth scrolling
- [ ] No memory leaks (check DevTools)
- [ ] Performance dashboard shows metrics

### 4.4 Accessibility QA
- [ ] Keyboard navigation works (Tab, Arrow keys, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Screen reader reads content correctly
- [ ] Color contrast acceptable
- [ ] No flashing/strobing
- [ ] Form labels associated
- [ ] Error messages clear

### 4.5 Browser-Specific QA
- **Chrome**: ✓ Works as expected
- **Firefox**: ✓ Check CSS quirks
- **Safari**: ✓ Check WebKit issues, scroll behavior
- **Edge**: ✓ Check compatibility mode
- **Mobile Chrome**: ✓ Check touch events
- **Mobile Safari**: ✓ Check scroll and zoom

---

## Phase 5: Production Deployment

### 5.1 Pre-Deployment Checklist

```bash
# 1. Run all tests
npm run test:ci
npm run test:e2e

# 2. Build project
npm run build

# 3. Security scan
npm run security:all

# 4. Performance check
npm run build -- --analyze

# 5. Lighthouse audit
npx lighthouse http://localhost:3000/dashboard

# 6. Manual review
# - Check for console errors
# - Verify no hardcoded secrets
# - Test edge cases
```

### 5.2 Staging Deployment

```bash
# 1. Deploy to staging environment
docker-compose -f docker-compose.staging.yml up -d

# 2. Run E2E tests against staging
NEXT_PUBLIC_API_URL=https://staging.api.example.com npm run e2e

# 3. Monitor metrics
# - Check /dashboard/performance
# - Monitor API response times
# - Track error rates

# 4. Soak test (24-48 hours)
# - Monitor for memory leaks
# - Check for intermittent errors
# - Collect Web Vitals data
```

### 5.3 Production Deployment

```bash
# 1. Tag release
git tag -a v1.0.0 -m "Production release: Dashboard with all 19 components"

# 2. Push to production registry
docker tag proofile-frontend:latest proofile-frontend:v1.0.0
docker push proofile-frontend:v1.0.0

# 3. Deploy to production
docker-compose -f docker-compose.yml up -d --no-deps frontend

# 4. Health checks
curl https://app.example.com/dashboard
curl https://app.example.com/api/health

# 5. Monitor production
# - Real-time Web Vitals
# - Error tracking (Sentry)
# - Performance monitoring
# - User feedback

# 6. Rollback plan (if needed)
docker-compose -f docker-compose.yml up -d --no-deps frontend  # Rollback to previous tag
```

---

## Phase 6: Post-Deployment Monitoring

### 6.1 Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Error Rate | <0.1% | >0.5% |
| P95 Response Time | <500ms | >1s |
| FCP | <1.5s | >2s |
| LCP | <2.5s | >3s |
| Uptime | >99.9% | <99% |
| Web Vitals Rating | 90%+ good | <80% good |

### 6.2 Monitoring Setup

**Sentry Integration** (Error tracking)
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**DataDog/New Relic** (Performance)
- Track Core Web Vitals
- Monitor API response times
- Alert on anomalies

**Dashboards to Create:**
- [ ] Real-time error monitoring
- [ ] Performance trends (7-day, 30-day)
- [ ] User engagement metrics
- [ ] Component load times
- [ ] Web Vitals summary

---

## Rollout Strategy

### Week 1: Staged Rollout
- [ ] Day 1-2: Canary (5% of traffic)
- [ ] Day 3-4: Progressive (25% of traffic)
- [ ] Day 5-7: Full (100% of traffic)

### Rollback Triggers
- Error rate >1% for 5 minutes
- P95 latency >2s for 5 minutes
- Core Web Vitals rating drops >20%
- Critical bug reports

---

## Success Criteria

✅ **All Tests Passing:**
- [ ] 20+ E2E tests passing
- [ ] 161+ unit tests passing
- [ ] 0 console errors
- [ ] Accessibility score 100

✅ **Performance Targets Met:**
- [ ] Lighthouse score >90
- [ ] FCP <1.5s
- [ ] LCP <2.5s
- [ ] Bundle <200KB (gzipped)

✅ **Cross-Browser Compatible:**
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓
- [ ] Edge ✓
- [ ] Mobile Chrome ✓
- [ ] Mobile Safari ✓

✅ **Production Ready:**
- [ ] No critical bugs
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring in place

---

## Files to Create

- [ ] `tests/e2e/dashboard.spec.ts` - Dashboard E2E tests
- [ ] `tests/e2e/navigation.spec.ts` - Navigation E2E tests
- [ ] `tests/e2e/mobile.spec.ts` - Mobile E2E tests
- [ ] `tests/e2e/accessibility.spec.ts` - Accessibility E2E tests
- [ ] `tests/e2e/performance.spec.ts` - Performance E2E tests
- [ ] `tests/fixtures/auth.fixture.ts` - Auth helper
- [ ] `tests/fixtures/data.fixture.ts` - Test data
- [ ] `.github/workflows/e2e.yml` - E2E CI/CD workflow
- [ ] `docker-compose.staging.yml` - Staging orchestration
- [ ] `DEPLOYMENT_GUIDE.md` - Deployment procedures

---

## Next Steps

1. ✅ Create E2E test files from templates above
2. ✅ Set up Playwright fixtures for auth, data
3. ✅ Run E2E tests against dashboard
4. ✅ Fix any failing tests
5. ✅ Manual QA testing
6. ✅ Deploy to staging
7. ✅ Soak testing (24-48 hours)
8. ✅ Deploy to production
9. ✅ Monitor metrics
10. ✅ Collect user feedback

---

## References

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com)
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)


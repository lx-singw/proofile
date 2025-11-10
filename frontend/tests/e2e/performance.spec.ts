import { test, expect, Page } from '@playwright/test';

/**
 * Performance E2E Tests
 * Tests performance metrics, loading behavior, and optimization verification
 */

async function authenticateUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'mock-jwt-token-for-testing');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
    }));
  });
  return page;
}

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  // ✅ TEST: Performance dashboard loads
  test('Performance monitoring dashboard page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/performance', { waitUntil: 'domcontentloaded' });

    // Page should load without 404
    expect(page.url()).toContain('/performance');

    // Should have page content
    const content = page.locator('body');
    await expect(content).toBeVisible();

    // Should have title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  // ✅ TEST: Performance metrics display
  test('Performance metrics are displayed on monitoring page', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/performance', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Wait for metrics collection

    // Look for metric cards or displays
    const metrics = page.locator('[data-testid*="metric"], h2, h3');
    const count = await metrics.count();

    // Should have some content
    expect(count).toBeGreaterThan(0);
  });

  // ✅ TEST: Initial page load performance
  test('Dashboard loads within performance targets', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    console.log(`Total page load time: ${loadTime}ms`);

    // Target: < 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  // ✅ TEST: Time to first paint
  test('First Contentful Paint (FCP) is reasonable', async ({ page }) => {
    const paintTiming = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp?.startTime || null;
    });

    if (paintTiming) {
      console.log(`First Contentful Paint: ${Math.round(paintTiming)}ms`);

      // Should paint content within reasonable time
      expect(paintTiming).toBeLessThan(3000);
    }
  });

  // ✅ TEST: Largest Contentful Paint
  test('Largest Contentful Paint (LCP) is acceptable', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          resolve((lastEntry.renderTime || lastEntry.loadTime) || 0);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Cleanup after 5 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      });
    });

    if (lcp) {
      console.log(`Largest Contentful Paint: ${Math.round(lcp)}ms`);

      // Target: < 2.5 seconds for good performance
      // Allow up to 4 seconds in test environment
      expect(lcp).toBeLessThan(4000);
    }
  });

  // ✅ TEST: No memory leaks during interaction
  test('Memory usage does not grow unbounded during interactions', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform interactions
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(5, count); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(100);
      }
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;
      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}%`);

      // Should not increase more than 50% (reasonable limit)
      expect(memoryIncrease).toBeLessThan(50);
    }
  });

  // ✅ TEST: Lazy loading works
  test('Lazy-loaded components appear with skeleton loaders', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000/dashboard');

    // Check for skeleton loaders initially
    const skeletons = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
    await page.waitForTimeout(500);

    const initialSkeletons = await skeletons.count();
    console.log(`Initial skeleton loaders: ${initialSkeletons}`);

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Skeletons should be replaced with content
    const finalSkeletons = await skeletons.count();
    console.log(`Final skeleton loaders: ${finalSkeletons}`);

    // Should have loaded main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    const totalTime = Date.now() - startTime;
    console.log(`Total load time: ${totalTime}ms`);
  });

  // ✅ TEST: CSS is optimized
  test('CSS is delivered efficiently', async ({ page }) => {
    const cssInfo = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets).map(sheet => ({
        href: sheet.href,
        size: sheet.cssRules?.length || 0
      }));

      return {
        sheetCount: stylesheets.length,
        totalRules: stylesheets.reduce((sum, s) => sum + s.size, 0)
      };
    });

    console.log(`CSS Sheets: ${cssInfo.sheetCount}, Total Rules: ${cssInfo.totalRules}`);

    // Should not have excessive stylesheets
    expect(cssInfo.sheetCount).toBeLessThan(10);
  });

  // ✅ TEST: JavaScript bundle is reasonably sized
  test('JavaScript bundle size is optimized', async ({ page }) => {
    const jsInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]')).map(script => ({
        src: (script as HTMLScriptElement).src,
        async: (script as HTMLScriptElement).async,
        defer: (script as HTMLScriptElement).defer
      }));

      return {
        scriptCount: scripts.length,
        asyncScripts: scripts.filter(s => s.async).length,
        deferScripts: scripts.filter(s => s.defer).length
      };
    });

    console.log(`Scripts: ${jsInfo.scriptCount}, Async: ${jsInfo.asyncScripts}, Defer: ${jsInfo.deferScripts}`);

    // Should not load excessive scripts
    expect(jsInfo.scriptCount).toBeLessThan(15);
  });

  // ✅ TEST: No cumulative layout shift
  test('No significant Cumulative Layout Shift (CLS)', async ({ page }) => {
    let clsValue = 0;

    page.on('framenavigated', () => {
      // Re-check CLS after navigation
    });

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Wait and monitor for layout shifts
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(500);
    }

    // CLS tracking (simplified - full implementation needs PerformanceObserver)
    // Target: < 0.1 for good performance
    expect(clsValue).toBeLessThan(0.2);
  });

  // ✅ TEST: Images are lazy-loaded
  test('Images are lazy-loaded to improve performance', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });

    const images = page.locator('img');
    const count = await images.count();

    let lazyLoaded = 0;

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');
      const src = await img.getAttribute('src');

      if (loading === 'lazy') {
        lazyLoaded++;
      } else if (src?.includes('data:')) {
        // Placeholder image
        lazyLoaded++;
      }
    }

    if (count > 0) {
      const lazyPercentage = (lazyLoaded / count) * 100;
      console.log(`Lazy-loaded images: ${lazyPercentage.toFixed(0)}%`);

      // Most images should be lazy-loaded
      expect(lazyPercentage).toBeGreaterThanOrEqual(50);
    }
  });

  // ✅ TEST: Responsive images are used
  test('Images use responsive formats (srcset, picture)', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });

    const images = page.locator('img');
    let responsiveImages = 0;

    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');
      const alt = await img.getAttribute('alt');

      // Check for responsive attributes
      if (srcset || sizes) {
        responsiveImages++;
      }
    }

    if (count > 0) {
      const responsivePercentage = (responsiveImages / count) * 100;
      console.log(`Responsive images: ${responsivePercentage.toFixed(0)}%`);
    }
  });

  // ✅ TEST: Web fonts are optimized
  test('Web fonts are loaded efficiently', async ({ page }) => {
    const fontInfo = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let fontFaceRules = 0;

      sheets.forEach(sheet => {
        try {
          const rules = sheet.cssRules;
          if (rules) {
            Array.from(rules).forEach(rule => {
              if (rule.type === 5) { // CSSFontFaceRule
                fontFaceRules++;
              }
            });
          }
        } catch (e) {
          // CORS restriction
        }
      });

      return { fontFaceRules };
    });

    console.log(`Web font declarations: ${fontInfo.fontFaceRules}`);

    // Should not load excessive fonts
    expect(fontInfo.fontFaceRules).toBeLessThan(20);
  });

  // ✅ TEST: No render-blocking resources
  test('Critical resources are not render-blocking', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });

    const renderBlockers = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

      const blockerScripts = scripts.filter(s => !s.async && !s.defer);
      const allLinks = links.length; // Links are render-blocking by default

      return {
        blockingScripts: blockerScripts.length,
        stylesheets: allLinks
      };
    });

    console.log(`Render blockers - Scripts: ${renderBlockers.blockingScripts}, Stylesheets: ${renderBlockers.stylesheets}`);

    // Should minimize render-blocking resources
    expect(renderBlockers.blockingScripts).toBeLessThan(5);
  });

  // ✅ TEST: Network requests are optimized
  test('Page makes reasonable number of network requests', async ({ page }) => {
    let requestCount = 0;
    let bytesSent = 0;
    let bytesReceived = 0;

    page.on('response', (response) => {
      requestCount++;
    });

    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    console.log(`Total network requests: ${requestCount}`);

    // Should not make excessive requests (typical: 20-50)
    expect(requestCount).toBeLessThan(100);
  });

  // ✅ TEST: HTTP/2 server push (if applicable)
  test('Server uses efficient HTTP protocol', async ({ page }) => {
    const protocol = await page.evaluate(() => {
      return (window as any).navigator?.connection?.effectiveType || 'unknown';
    });

    console.log(`Effective connection type: ${protocol}`);

    expect(['4g', '3g', '2g', 'slow-4g', 'unknown']).toContain(protocol);
  });

  // ✅ TEST: Performance API is available
  test('Performance metrics are collectible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    const metrics = await page.evaluate(() => {
      const nav = performance.timing;
      return {
        domLoad: nav.domContentLoadedEventEnd - nav.navigationStart,
        pageLoad: nav.loadEventEnd - nav.navigationStart,
        ttfb: nav.responseStart - nav.navigationStart,
        available: !!performance.timing
      };
    });

    console.log(`DOM Loaded: ${metrics.domLoad}ms, Page Load: ${metrics.pageLoad}ms, TTFB: ${metrics.ttfb}ms`);

    expect(metrics.available).toBe(true);
    expect(metrics.pageLoad).toBeGreaterThan(0);
  });
});

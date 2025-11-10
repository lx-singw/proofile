/**
 * Web Vitals Tracking
 * 
 * Tracks Core Web Vitals (CWV) and sends metrics to backend for monitoring
 * Metrics tracked:
 * - FCP: First Contentful Paint (<1.5s target)
 * - LCP: Largest Contentful Paint (<2.5s target)  
 * - TTI: Time to Interactive (<3s target)
 * - CLS: Cumulative Layout Shift (<0.1 target)
 * - FID: First Input Delay (<100ms target)
 * - TTFB: Time to First Byte (<600ms target)
 */

interface WebVitalMetric {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTI' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

interface MetricsPayload {
  metrics: WebVitalMetric[];
  pageUrl: string;
  timestamp: string;
  userAgent: string;
  sessionId: string;
}

/**
 * Get rating based on metric thresholds
 */
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (metric) {
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 600 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'needs-improvement';
  }
}

/**
 * Send metrics to backend
 */
async function sendMetricsToBackend(payload: MetricsPayload) {
  try {
    // Only send if in production or explicitly enabled
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_TRACK_WEB_VITALS === 'true'
    ) {
      await fetch('/api/metrics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        // Use beacon API for reliability (best effort delivery)
        keepalive: true,
      }).catch((err) => {
        // Silently fail - don't impact user experience
        if (process.env.NODE_ENV === 'development') {
          console.debug('Web Vitals metric send failed:', err);
        }
      });
    }
  } catch (error) {
    // Ignore errors to not impact performance
  }
}

/**
 * Log metric to console in development
 */
function logMetric(metric: WebVitalMetric) {
  if (process.env.NODE_ENV === 'development') {
    const rating = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${rating} ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`
    );
  }
}

/**
 * Track Core Web Vitals using standard Web Vitals API
 * See: https://web.dev/vitals/
 */
export function trackWebVitals() {
  // Only run in browser
  if (typeof window === 'undefined') return;

  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const metrics: WebVitalMetric[] = [];

  // Use web-vitals via script tag approach (library is installed)
  try {
    // Simple PerformanceObserver approach for browsers supporting it
    if ('PerformanceObserver' in window) {
      // Observe paint timing (FCP)
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const metric: WebVitalMetric = {
              name: 'FCP',
              value: entry.startTime,
              rating: getRating('FCP', entry.startTime),
              id: `${entry.startTime}`,
            };
            metrics.push(metric);
            logMetric(metric);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

      // Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const lastEntry = list.getEntries().pop();
        if (lastEntry) {
          const metric: WebVitalMetric = {
            name: 'LCP',
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
            id: lastEntry.id,
          };
          metrics.push(metric);
          logMetric(metric);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        const metric: WebVitalMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          id: `cls-${clsValue}`,
        };
        logMetric(metric);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Measure TTFB from navigation timing
    if ('PerformanceTiming' in window) {
      const nav = performance.timing;
      const ttfb = nav.responseStart - nav.navigationStart;
      const metric: WebVitalMetric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        id: `ttfb-${ttfb}`,
      };
      metrics.push(metric);
      logMetric(metric);
    }

    // Send metrics after a delay
    setTimeout(() => {
      if (metrics.length > 0) {
        sendMetricsToBackend({
          metrics,
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          sessionId,
        });
      }
    }, 5000);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('Web Vitals tracking error:', error);
    }
  }
}

/**
 * Get real-time performance metrics
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.fetchStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domProcessing: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    resourceLoad: navigation?.loadEventStart - navigation?.domContentLoadedEventEnd,
    load: navigation?.loadEventEnd - navigation?.fetchStart,

    // Paint timing
    fcp: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    lcp: paint.find((p) => p.name === 'largest-contentful-paint')?.startTime,

    // Memory (if available)
    memory: (performance as any).memory
      ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        }
      : null,
  };
}

/**
 * Mark custom performance events
 */
export const performanceMarks = {
  dashboardStart: () => performance.mark('dashboard-start'),
  dashboardEnd: () => performance.mark('dashboard-end'),
  componentsStart: () => performance.mark('components-start'),
  componentsEnd: () => performance.mark('components-end'),
  dataFetchStart: () => performance.mark('data-fetch-start'),
  dataFetchEnd: () => performance.mark('data-fetch-end'),
};

/**
 * Measure custom performance events
 */
export function measurePerformance(startMark: string, endMark: string, label: string) {
  try {
    performance.measure(label, startMark, endMark);
    const measure = performance.getEntriesByName(label)[0];
    if (measure) {
      console.log(`⏱️ ${label}: ${Math.round(measure.duration)}ms`);
      return measure.duration;
    }
  } catch (error) {
    console.debug('Performance measurement error:', error);
  }
  return null;
}

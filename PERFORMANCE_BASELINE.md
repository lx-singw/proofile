# Performance Baseline & Optimization Sprint 6

## Objective
Achieve production-ready performance with:
- **Lighthouse Score**: >90
- **First Contentful Paint (FCP)**: <1.5s
- **Time to Interactive (TTI)**: <3s
- **Bundle Size**: <200KB (gzipped)
- **Largest Contentful Paint (LCP)**: <2.5s

---

## Phase 1: Baseline Measurement

### 1.1 Current Bundle Analysis
Run to analyze current bundle:
```bash
cd frontend
npm run build
npm run analyze  # if available, or use webpack-bundle-analyzer
```

Key metrics to track:
- **JS Bundle Size** (before/after gzip)
- **CSS Bundle Size**
- **Number of chunks**
- **Third-party dependencies size**

### 1.2 Lighthouse Audit Baseline
Run Lighthouse audit to get baseline scores:
```bash
npx lighthouse http://localhost:3000/dashboard --chrome-flags="--headless" --output-path=lighthouse-baseline.html
```

Baseline metrics (to be populated after first run):
- Performance: ___
- Accessibility: ___
- Best Practices: ___
- SEO: ___
- FCP: ___ ms
- LCP: ___ ms
- TTI: ___ ms
- CLS: ___

---

## Phase 2: Code Splitting & Lazy Loading

### 2.1 Component-Level Code Splitting
Status: ⏳ TODO
- [ ] Implement dynamic imports for heavy components
  - `StatsCards` - Analytics rendering
  - `ActivityGraph` - Chart library
  - `ActivityFeed` - Large list rendering
  - `ProfileCompletion` - Complex animations

Example pattern:
```typescript
const StatsCards = dynamic(() => import('@/components/dashboard/StatsCards'), {
  loading: () => <Skeleton />,
  ssr: false  // Disable SSR for client-only components
});
```

### 2.2 Route-Level Code Splitting
Status: ⏳ TODO
- Next.js automatic code splitting already enabled for `/app` directory
- Verify no large libraries imported at root level
- Lazy load routes: auth pages, settings, admin sections

### 2.3 Image Optimization
Status: ⏳ TODO
- [ ] Convert all images to WebP with fallbacks
- [ ] Add `next/image` component with `priority` and `loading` attributes
- [ ] Implement image lazy loading for avatars, widgets
- [ ] Add responsive image sizes: `sizes="(max-width: 768px) 100vw, 50vw"`

---

## Phase 3: Bundle Optimization

### 3.1 Tree-Shaking & Dead Code Elimination
Status: ⏳ TODO
- [ ] Audit imported libraries for unused exports
- [ ] Remove unused dependencies from `package.json`
- [ ] Ensure `sideEffects: false` in library dependencies
- [ ] Verify Next.js uses modern bundler optimizations

Top dependencies to audit:
- `lucide-react` - only import used icons
- `tailwindcss` - tree-shake unused utilities
- `@tanstack/react-query` - only import needed exports

### 3.2 Compression & Minification
Status: ⏳ TODO
- [ ] Verify gzip compression enabled in docker/nginx config
- [ ] Enable Brotli compression for production (better ratio)
- [ ] Check Terser minification settings in `next.config.ts`
- [ ] Profile CSS minification

### 3.3 Dependency Optimization
Status: ⏳ TODO
Candidates for replacement/removal:
- Large date libraries → use native `Intl` API or lighter alternatives
- Multiple utility libraries → consolidate
- UI libraries → verify all components used

---

## Phase 4: Runtime Performance

### 4.1 Rendering Optimization
Status: ⏳ TODO
- [ ] Add `useMemo` to expensive calculations in widgets
- [ ] Implement `useCallback` for stable function references
- [ ] Use `React.memo` for list items (ActivityFeed items)
- [ ] Profile render times with React DevTools Profiler

### 4.2 Data Fetching Optimization
Status: ⏳ TODO
- [ ] Implement request batching for dashboard load
- [ ] Add request deduplication (already in TanStack Query)
- [ ] Prefetch common routes on navigation
- [ ] Implement pagination for ActivityFeed (load more on scroll)

### 4.3 CSS & Animation Performance
Status: ⏳ TODO
- [ ] Use `will-change` CSS for animations
- [ ] Optimize Tailwind utility classes (remove unused)
- [ ] Profile paint times for complex layouts
- [ ] Use `transform` and `opacity` for animations (GPU-accelerated)

---

## Phase 5: Loading States & Skeleton Screens

### 5.1 Skeleton Components
Status: ⏳ TODO
Already have skeleton patterns. Ensure used for:
- [ ] Dashboard page initial load
- [ ] StatsCards while data loading
- [ ] ActivityFeed items
- [ ] ProfileSummaryCard

### 5.2 Progressive Enhancement
Status: ⏳ TODO
- [ ] Show skeleton → data → hydration (no layout shift)
- [ ] Implement Suspense boundaries for async components
- [ ] Add `loading.tsx` for streaming responses

---

## Phase 6: Monitoring & Metrics

### 6.1 Web Vitals Tracking
Status: ⏳ TODO
Create `lib/web-vitals.ts`:
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function trackWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

Integrate into `app/layout.tsx`:
```typescript
'use client';
import { trackWebVitals } from '@/lib/web-vitals';

export default function RootLayout({ children }) {
  useEffect(() => {
    trackWebVitals();
  }, []);
  return <>{children}</>;
}
```

### 6.2 Performance Dashboard
Status: ⏳ TODO
- Create monitoring page at `/dashboard/performance`
- Track FCP, LCP, TTI, CLS metrics
- Store metrics in Redis for trending analysis
- Alert on degradation

---

## Implementation Checklist

### 🟢 HIGH PRIORITY (Phase 2-3)
- [ ] Code split heavy components (StatsCards, ActivityGraph)
- [ ] Lazy load images with `next/image`
- [ ] Remove unused dependencies
- [ ] Optimize bundle with tree-shaking

### 🟡 MEDIUM PRIORITY (Phase 4-5)
- [ ] Implement memoization for expensive renders
- [ ] Add pagination to ActivityFeed
- [ ] Create skeleton screens for all widgets
- [ ] Optimize animations

### 🔵 LOW PRIORITY (Phase 6)
- [ ] Set up Web Vitals monitoring
- [ ] Create performance dashboard
- [ ] Add performance regression tests

---

## Tools & Resources

- **Lighthouse**: Built-in browser audit
- **React DevTools Profiler**: Runtime performance analysis
- **webpack-bundle-analyzer**: Bundle visualization
- **Next.js Telemetry**: Built-in Next.js analytics
- **Chrome DevTools Performance Tab**: Frame-by-frame debugging

---

## Success Criteria

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Lighthouse Score | 90+ | TBD | ⏳ |
| FCP | <1.5s | TBD | ⏳ |
| LCP | <2.5s | TBD | ⏳ |
| TTI | <3s | TBD | ⏳ |
| Bundle (gzipped) | <200KB | TBD | ⏳ |
| CLS | <0.1 | TBD | ⏳ |

---

## Next Steps

1. Run initial Lighthouse audit and populate baseline numbers
2. Analyze bundle with webpack-bundle-analyzer
3. Identify top 3 performance bottlenecks
4. Implement Phase 2 (code splitting) first - highest ROI
5. Re-run Lighthouse after each major change
6. Commit changes with performance metrics in commit message


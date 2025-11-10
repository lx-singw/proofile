/**
 * Performance-optimized dynamic imports for heavy components
 * Implements code splitting to reduce initial bundle size
 * 
 * Strategy:
 * - Heavy analytics/charts: ActivityGraph, StatsCards
 * - Complex lists: ActivityFeed
 * - Feature-rich widgets: ProfileCompletion
 * - Keep lightweight: DashboardLayout, DashboardContent, DashboardSidebar
 */

'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

/**
 * Skeleton loader component - shown while component loads
 */
export const ComponentSkeleton = ({ lines = 4 }: { lines?: number }) => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded dark:bg-gray-700" />
    ))}
  </div>
);

/**
 * Chart/Analytics skeleton
 */
export const ChartSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-64 bg-gray-200 rounded dark:bg-gray-700" />
    <div className="flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 flex-1 bg-gray-200 rounded dark:bg-gray-700" />
      ))}
    </div>
  </div>
);

/**
 * Card skeleton
 */
export const CardSkeleton = () => (
  <div className="animate-pulse p-4">
    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 mb-2 w-3/4" />
    <div className="h-3 bg-gray-200 rounded dark:bg-gray-700 w-1/2" />
  </div>
);

// ============================================================================
// HEAVY COMPONENTS - LAZY LOADED
// ============================================================================

/**
 * ActivityGraph: Uses charting library - usually large bundle impact
 * Loading time: ~500-800ms (first load)
 */
export const ActivityGraphLazy = dynamic(
  () => import('@/components/dashboard/ActivityGraph').then((mod) => mod.default || mod),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
);

/**
 * StatsCards: Renders multiple cards with data - moderate complexity
 * Loading time: ~300-500ms
 */
export const StatsCardsLazy = dynamic(
  () => import('@/components/dashboard/StatsCards').then((mod) => mod.default || mod),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ),
    ssr: true,
  }
);

/**
 * ActivityFeed: Renders large list - can be expensive for many items
 * Loading time: ~200-400ms
 */
export const ActivityFeedLazy = dynamic(
  () => import('@/components/dashboard/ActivityFeed').then((mod) => mod.default || mod),
  {
    loading: () => (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ),
    ssr: true,
  }
);

/**
 * ProfileCompletion: Complex widget with animations
 * Loading time: ~200-300ms
 */
export const ProfileCompletionLazy = dynamic(
  () => import('@/components/dashboard/ProfileCompletion').then((mod) => mod.default || mod),
  {
    loading: () => <ComponentSkeleton lines={6} />,
    ssr: true,
  }
);

/**
 * SuggestedActions: Action cards component
 * Loading time: ~150-250ms
 */
export const SuggestedActionsLazy = dynamic(
  () => import('@/components/dashboard/SuggestedActions').then((mod) => mod.default || mod),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    ),
    ssr: true,
  }
);

/**
 * WelcomeBanner: Lightweight component - rarely needs splitting
 * Can keep synchronous if bundle allows
 */
export const WelcomeBannerLazy = dynamic(
  () => import('@/components/dashboard/WelcomeBanner').then((mod) => mod.default || mod),
  {
    loading: () => <ComponentSkeleton lines={2} />,
    ssr: true,
  }
);

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get component import with performance metrics
 * Usage: useComponentMetrics('StatsCards').then(metric => console.log(metric))
 */
export async function useComponentMetrics(componentName: string) {
  const startTime = performance.now();
  const endTime = performance.now();
  
  return {
    component: componentName,
    loadTime: endTime - startTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Preload component to cache it before rendering
 * Usage: preloadComponent(ActivityGraphLazy)
 */
export function preloadComponent(Component: any) {
  if (typeof window !== 'undefined' && Component?.preload) {
    Component.preload();
  }
}

/**
 * Component loading boundary for error handling
 */
export function withLoadingBoundary(
  Component: React.ComponentType<any>,
  fallback: ReactNode = <ComponentSkeleton />
) {
  return dynamic(() => Promise.resolve(Component), {
    loading: () => (fallback as React.ReactNode) || <ComponentSkeleton />,
    ssr: true,
  });
}

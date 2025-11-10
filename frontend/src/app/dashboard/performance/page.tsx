'use client';

import { useEffect, useState } from 'react';
import { getPerformanceMetrics, trackWebVitals } from '@/lib/web-vitals';
import { ArrowUp, TrendingUp, Activity, Zap } from 'lucide-react';

interface PerformanceData {
  dns?: number;
  tcp?: number;
  ttfb?: number;
  download?: number;
  domProcessing?: number;
  resourceLoad?: number;
  load?: number;
  fcp?: number;
  lcp?: number;
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatTime(ms?: number): string {
  if (!ms) return 'N/A';
  return Math.round(ms) + 'ms';
}

function getRatingColor(metricType: string, value?: number): string {
  if (!value) return 'text-gray-500';

  const thresholds: Record<string, { good: number; fair: number }> = {
    FCP: { good: 1800, fair: 3000 },
    LCP: { good: 2500, fair: 4000 },
    TTFB: { good: 600, fair: 1800 },
    TTI: { good: 3000, fair: 5000 },
    DNS: { good: 100, fair: 300 },
    TCP: { good: 100, fair: 300 },
    Download: { good: 500, fair: 1500 },
  };

  const threshold = thresholds[metricType];
  if (!threshold) return 'text-gray-500';

  if (value <= threshold.good) return 'text-green-600';
  if (value <= threshold.fair) return 'text-yellow-600';
  return 'text-red-600';
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  rating?: string;
}

function MetricCard({ label, value, unit, icon, rating }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className={`text-2xl font-bold ${rating}`}>{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{unit}</p>
          </div>
        </div>
        <div className="text-gray-300 dark:text-gray-600">{icon}</div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Start tracking web vitals
      trackWebVitals();

      // Get performance metrics after page load
      const timer = setTimeout(() => {
        const data = getPerformanceMetrics();
        setMetrics(data);
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to load performance metrics');
      setLoading(false);
      console.error('Performance loading error:', err);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400">Loading real-time metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8" />
          Performance Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time Core Web Vitals and Performance Metrics
        </p>
      </div>

      {/* Core Web Vitals Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Core Web Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="First Contentful Paint"
            value={formatTime(metrics?.fcp)}
            unit="ms"
            icon={<ArrowUp className="w-6 h-6" />}
            rating={getRatingColor('FCP', metrics?.fcp)}
          />
          <MetricCard
            label="Largest Contentful Paint"
            value={formatTime(metrics?.lcp)}
            unit="ms"
            icon={<TrendingUp className="w-6 h-6" />}
            rating={getRatingColor('LCP', metrics?.lcp)}
          />
          <MetricCard
            label="Time to First Byte"
            value={formatTime(metrics?.ttfb)}
            unit="ms"
            icon={<Zap className="w-6 h-6" />}
            rating={getRatingColor('TTFB', metrics?.ttfb)}
          />
          <MetricCard
            label="Total Load Time"
            value={formatTime(metrics?.load)}
            unit="ms"
            icon={<Activity className="w-6 h-6" />}
            rating={getRatingColor('TTI', metrics?.load)}
          />
        </div>
      </div>

      {/* Navigation Timing */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Navigation Timing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="DNS Lookup"
            value={formatTime(metrics?.dns)}
            unit="ms"
            icon={<Activity className="w-6 h-6" />}
            rating={getRatingColor('DNS', metrics?.dns)}
          />
          <MetricCard
            label="TCP Connection"
            value={formatTime(metrics?.tcp)}
            unit="ms"
            icon={<Activity className="w-6 h-6" />}
            rating={getRatingColor('TCP', metrics?.tcp)}
          />
          <MetricCard
            label="Download Time"
            value={formatTime(metrics?.download)}
            unit="ms"
            icon={<Activity className="w-6 h-6" />}
            rating={getRatingColor('Download', metrics?.download)}
          />
          <MetricCard
            label="DOM Processing"
            value={formatTime(metrics?.domProcessing)}
            unit="ms"
            icon={<Activity className="w-6 h-6" />}
            rating={getRatingColor('Download', metrics?.domProcessing)}
          />
        </div>
      </div>

      {/* Memory Usage */}
      {metrics?.memory && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Memory Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Used JS Heap"
              value={formatBytes(metrics.memory.usedJSHeapSize)}
              unit=""
              icon={<Activity className="w-6 h-6" />}
            />
            <MetricCard
              label="Total JS Heap"
              value={formatBytes(metrics.memory.totalJSHeapSize)}
              unit=""
              icon={<Activity className="w-6 h-6" />}
            />
            <MetricCard
              label="Heap Limit"
              value={formatBytes(metrics.memory.jsHeapSizeLimit)}
              unit=""
              icon={<Activity className="w-6 h-6" />}
            />
          </div>
        </div>
      )}

      {/* Performance Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Performance Targets</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>✓ FCP (First Contentful Paint): &lt; 1.8s (Good)</li>
          <li>✓ LCP (Largest Contentful Paint): &lt; 2.5s (Good)</li>
          <li>✓ TTFB (Time to First Byte): &lt; 600ms (Good)</li>
          <li>✓ Total Load: &lt; 3s (Target)</li>
        </ul>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

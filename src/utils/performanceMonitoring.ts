import { trackEvent } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function reportMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Performance] ${metric.name}:`, {
      value: `${Math.round(metric.value)}ms`,
      rating: metric.rating,
    });
  }

  // Track in analytics
  trackEvent({
    eventType: 'performance',
    eventCategory: 'web_vitals',
    eventAction: metric.name.toLowerCase(),
    eventLabel: metric.rating,
    eventValue: Math.round(metric.value),
  });
}

// Largest Contentful Paint (LCP)
function observeLCP() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
    
    const value = lastEntry.renderTime || lastEntry.loadTime || 0;
    reportMetric({
      name: 'LCP',
      value,
      rating: getRating('LCP', value),
    });
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation failed:', e);
  }
}

// First Input Delay (FID)
function observeFID() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: PerformanceEntry & { processingStart?: number; startTime?: number }) => {
      const value = entry.processingStart! - entry.startTime!;
      reportMetric({
        name: 'FID',
        value,
        rating: getRating('FID', value),
      });
    });
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation failed:', e);
  }
}

// Cumulative Layout Shift (CLS)
function observeCLS() {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    
    entries.forEach((entry: PerformanceEntry & { value?: number; hadRecentInput?: boolean }) => {
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0];
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          sessionValue += entry.value!;
          sessionEntries.push(entry);
        } else {
          sessionValue = entry.value!;
          sessionEntries = [entry];
        }

        if (sessionValue > clsValue) {
          clsValue = sessionValue;
          reportMetric({
            name: 'CLS',
            value: clsValue,
            rating: getRating('CLS', clsValue),
          });
        }
      }
    });
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation failed:', e);
  }
}

// First Contentful Paint (FCP)
function observeFCP() {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        reportMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
        });
      }
    });
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP observation failed:', e);
  }
}

// Time to First Byte (TTFB)
function observeTTFB() {
  if (!('performance' in window) || !('timing' in performance)) return;

  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigationEntry) {
    const value = navigationEntry.responseStart - navigationEntry.requestStart;
    reportMetric({
      name: 'TTFB',
      value,
      rating: getRating('TTFB', value),
    });
  }
}

// Track component render time
export function measureComponentRender(componentName: string, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (import.meta.env.DEV && duration > 16) { // Longer than one frame
    console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
  }

  if (duration > 50) { // Track slow renders
    trackEvent({
      eventType: 'performance',
      eventCategory: 'component_render',
      eventAction: 'slow_render',
      eventLabel: componentName,
      eventValue: Math.round(duration),
    });
  }
}

// Track route change performance
export function measureRouteChange(route: string, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;

  trackEvent({
    eventType: 'performance',
    eventCategory: 'navigation',
    eventAction: 'route_change',
    eventLabel: route,
    eventValue: Math.round(duration),
  });
}

// Initialize all performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Observe Core Web Vitals
  observeLCP();
  observeFID();
  observeCLS();
  observeFCP();
  observeTTFB();

  // Track resource timing
  if ('performance' in window && 'getEntriesByType' in performance) {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
      const totalDuration = resources.reduce((sum, resource) => sum + resource.duration, 0);

      if (import.meta.env.DEV) {
        console.log('[Performance] Resources:', {
          count: resources.length,
          totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
          avgDuration: `${(totalDuration / resources.length).toFixed(2)}ms`,
        });
      }

      trackEvent({
        eventType: 'performance',
        eventCategory: 'resources',
        eventAction: 'load_complete',
        eventValue: Math.round(totalSize / 1024), // KB
      });
    });
  }
}

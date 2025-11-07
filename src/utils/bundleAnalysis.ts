/**
 * Bundle Analysis Utilities
 * 
 * To analyze bundle size, run:
 * npm run build -- --stats
 * 
 * Then use a tool like webpack-bundle-analyzer or vite-bundle-visualizer
 */

export const BUNDLE_SIZE_TARGETS = {
  // Target sizes in KB (gzipped)
  mainBundle: 150,
  vendorBundle: 200,
  totalInitial: 350,
};

export function logBundleInfo() {
  if (import.meta.env.DEV) {
    console.log('[Bundle] Analysis targets:', BUNDLE_SIZE_TARGETS);
    console.log('[Bundle] To analyze bundle size, run: npm run build');
  }
}

// Track lazy-loaded chunks
if (typeof window !== 'undefined' && 'performance' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource' && entry.name.includes('chunk')) {
        const resource = entry as PerformanceResourceTiming;
        console.log('[Bundle] Lazy chunk loaded:', {
          name: entry.name.split('/').pop(),
          size: `${((resource.transferSize || 0) / 1024).toFixed(2)} KB`,
          duration: `${resource.duration.toFixed(2)}ms`,
        });
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // Observer not supported
  }
}

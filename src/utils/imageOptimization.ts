/**
 * Utility functions for image optimization
 */

/**
 * Generate a tiny blur placeholder for an image URL
 * This creates a very small data URL that can be used as a blur placeholder
 */
export const generateBlurPlaceholder = (width = 10, height = 10): string => {
  // Create a simple gray gradient as placeholder
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='1'/%3E%3C/filter%3E%3Crect width='${width}' height='${height}' fill='%23e5e7eb' filter='url(%23b)'/%3E%3C/svg%3E`;
};

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Check if WebP is supported
 */
export const isWebPSupported = (): boolean => {
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get optimized image source based on browser support
 * If WebP is supported and a WebP URL is available, use it
 */
export const getOptimizedImageSrc = (
  originalSrc: string,
  webpSrc?: string
): string => {
  if (webpSrc && isWebPSupported()) {
    return webpSrc;
  }
  return originalSrc;
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (baseUrl: string, sizes: number[]): string => {
  return sizes
    .map(size => {
      // If using a CDN with automatic resizing (e.g., Supabase Storage with transforms)
      // you would construct URLs like: `${baseUrl}?width=${size} ${size}w`
      return `${baseUrl} ${size}w`;
    })
    .join(', ');
};

/**
 * Image Optimization Utilities
 * 
 * Transforms Supabase Storage URLs to use image transformation API
 * for automatic resizing and WebP conversion (~90% size reduction)
 */

interface ImageOptimizationOptions {
  /** Target width in pixels */
  width: number;
  /** Target height in pixels (optional, maintains aspect ratio if not specified) */
  height?: number;
  /** Quality 1-100, defaults to 80 (good balance of quality and size) */
  quality?: number;
}

/**
 * Transforms a Supabase Storage URL to use image transformation
 * Returns WebP format at specified dimensions for ~90% size reduction
 * 
 * @example
 * // Original: 500KB PNG
 * const url = "https://xxx.supabase.co/storage/v1/object/public/restaurant-logos/logo.png"
 * 
 * // Optimized: ~15KB WebP at 96x96
 * const optimized = getOptimizedImageUrl(url, { width: 96, height: 96 })
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: ImageOptimizationOptions
): string | null {
  if (!originalUrl) return null;
  
  // Only transform Supabase storage URLs
  if (!originalUrl.includes('supabase.co/storage/v1/object/public/')) {
    return originalUrl;
  }
  
  // Convert /object/public/ to /render/image/public/ for transformation
  const transformUrl = originalUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  
  // Add transformation parameters
  const params = new URLSearchParams();
  params.set('width', options.width.toString());
  if (options.height) {
    params.set('height', options.height.toString());
  }
  params.set('quality', (options.quality || 80).toString());
  
  return `${transformUrl}?${params.toString()}`;
}

/**
 * Preset dimensions for common logo display sizes across the app
 */
export const LOGO_SIZES = {
  /** Mobile carousel cards - 80x80 */
  mobileCarousel: { width: 80, height: 80 },
  /** Desktop carousel cards - 96x96 */
  desktopCarousel: { width: 96, height: 96 },
  /** Search result cards mobile - 80x80 */
  searchResultMobile: { width: 80, height: 80 },
  /** Search result cards desktop - 96x96 */
  searchResultDesktop: { width: 96, height: 96 },
  /** Map preview cards - 48x48 */
  mapPreview: { width: 48, height: 48 },
  /** Map preview mobile - larger touch target */
  mapPreviewMobile: { width: 96, height: 96 },
  /** Restaurant profile header - 160x160 */
  profileHeader: { width: 160, height: 160 },
} as const;

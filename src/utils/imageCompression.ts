/**
 * Client-side image compression utility
 * Uses Canvas API to resize and compress images before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  format: 'webp',
};

/**
 * Loads an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculates new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Only resize if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      width = Math.min(width, maxWidth);
      height = Math.round(width / aspectRatio);
    } else {
      height = Math.min(height, maxHeight);
      width = Math.round(height * aspectRatio);
    }

    // Ensure we don't exceed either dimension
    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  return { width, height };
}

/**
 * Checks if the browser supports WebP encoding
 */
function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Compresses an image file using Canvas API
 * 
 * @param file - The original image File
 * @param options - Compression options (maxWidth, maxHeight, quality, format)
 * @returns A compressed Blob and the appropriate file extension
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; extension: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip compression for GIFs (to preserve animation)
  if (file.type === 'image/gif') {
    return { blob: file, extension: 'gif' };
  }

  // Load the image
  const img = await loadImage(file);

  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the image
  ctx.drawImage(img, 0, 0, width, height);

  // Determine output format
  let mimeType: string;
  let extension: string;

  if (opts.format === 'webp' && supportsWebP()) {
    mimeType = 'image/webp';
    extension = 'webp';
  } else {
    mimeType = 'image/jpeg';
    extension = 'jpg';
  }

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      mimeType,
      opts.quality
    );
  });

  console.log(
    `Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`
  );

  return { blob, extension };
}

/**
 * Compresses an image specifically for restaurant logos
 * Uses optimized settings for logo display (512x512 max, WebP format)
 */
export async function compressLogoImage(file: File): Promise<{ blob: Blob; extension: string }> {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    format: 'webp',
  });
}

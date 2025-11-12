import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from './optimized-image';

interface LazyImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  blurDataURL?: string;
  className?: string;
  containerClassName?: string;
  rootMargin?: string;
  threshold?: number;
}

/**
 * Lazy-loaded image component that uses Intersection Observer
 * to only load images when they're about to enter the viewport
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc,
  aspectRatio,
  objectFit = 'cover',
  blurDataURL,
  className,
  containerClassName,
  rootMargin = '50px',
  threshold = 0.01,
}) => {
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={imgRef} className={cn("relative w-full h-full", containerClassName)}>
      {isInView ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc}
          aspectRatio={aspectRatio}
          objectFit={objectFit}
          blurDataURL={blurDataURL}
          className={className}
        />
      ) : (
        <div 
          className="w-full h-full bg-muted animate-pulse"
          style={{ aspectRatio }}
        />
      )}
    </div>
  );
};

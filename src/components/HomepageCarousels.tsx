import React from 'react';
import { useHomepageCarousels } from '@/hooks/useHomepageCarousels';
import { HomepageCarousel } from './HomepageCarousel';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export const HomepageCarousels: React.FC = () => {
  const { data: carousels, isLoading, error } = useHomepageCarousels();
  const isMobile = useIsMobile();

  // Don't render carousels on mobile
  if (isMobile) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="flex space-x-4 min-h-[160px]">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-40 w-64 flex-shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive text-sm">
            Unable to load featured merchants. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!carousels || carousels.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-6 lg:px-8 xl:px-12 pb-8">
      <div className="space-y-8">
        {carousels.map((carousel) => (
          <HomepageCarousel key={carousel.id} carousel={carousel} />
        ))}
      </div>
    </div>
  );
};
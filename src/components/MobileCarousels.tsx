import React from 'react';
import { useHomepageCarousels } from '@/hooks/useHomepageCarousels';
import { MobileCarousel } from './MobileCarousel';
import { Skeleton } from '@/components/ui/skeleton';

export const MobileCarousels: React.FC = () => {
  const { data: carousels, isLoading, error } = useHomepageCarousels();

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex space-x-2 overflow-hidden min-h-[220px]">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-[220px] w-52 flex-shrink-0 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
          <p className="text-red-200 text-sm">
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
    <div className="mt-4">
      {carousels.map((carousel) => (
        <MobileCarousel key={carousel.id} carousel={carousel} />
      ))}
    </div>
  );
};
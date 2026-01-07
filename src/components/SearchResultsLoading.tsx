import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export const SearchResultsLoading: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="animate-fade-in">
          <CardContent className="p-4 sm:p-6">
            {isMobile ? (
              // Mobile skeleton layout - matches actual card height (160px)
              <div className="flex items-start space-x-3 min-h-[140px]">
                {/* Logo skeleton with aspect ratio */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-20 h-20 aspect-square rounded-lg" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2.5">
                  {/* Restaurant name and location skeleton */}
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  
                  {/* Badges skeleton - matches min-h-[32px] */}
                  <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                  
                  {/* Category tags skeleton */}
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ) : (
              // Desktop skeleton layout
              <div className="flex items-start space-x-4">
                {/* Logo skeleton with aspect ratio */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-24 h-24 aspect-square rounded-lg" />
                </div>
                
                {/* Restaurant details skeleton */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-7 w-2/3" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-1/3" />
                      
                      {/* Category tags skeleton */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

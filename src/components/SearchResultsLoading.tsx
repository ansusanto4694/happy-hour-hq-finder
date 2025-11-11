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
              // Mobile skeleton layout
              <div className="flex items-start space-x-4">
                {/* Logo skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-20 h-20 rounded-lg" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Restaurant name skeleton */}
                  <Skeleton className="h-6 w-3/4" />
                  
                  {/* Location skeleton */}
                  <Skeleton className="h-5 w-1/2" />
                  
                  {/* Badges skeleton */}
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                  
                  {/* Category tags skeleton */}
                  <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </div>
            ) : (
              // Desktop skeleton layout
              <div className="flex items-start space-x-4">
                {/* Logo skeleton */}
                <div className="flex-shrink-0">
                  <Skeleton className="w-24 h-24 rounded-lg" />
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

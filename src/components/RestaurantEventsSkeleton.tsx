import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const RestaurantEventsSkeleton: React.FC = () => {
  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6">
        <Skeleton className="h-7 w-40 mb-4" />
        
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

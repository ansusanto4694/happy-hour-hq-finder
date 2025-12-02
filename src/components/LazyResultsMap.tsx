import React, { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Lazy load the ResultsMap component to reduce initial bundle size
const ResultsMap = lazy(() => 
  import('./ResultsMap').then(module => ({ default: module.ResultsMap }))
);

interface LazyResultsMapProps {
  restaurants?: any[];
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  showSearchThisArea?: boolean;
  onSearchThisArea?: () => void;
  isUsingMapSearch?: boolean;
  viewState?: { longitude: number; latitude: number; zoom: number };
  onViewStateChange?: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
  isMobile?: boolean;
  hoveredRestaurantId?: number | null;
  searchLocation?: string;
  resultsKey?: string;
}

// Loading fallback for map
const MapLoadingFallback = () => (
  <Card className="h-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-semibold">Map View</CardTitle>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <div className="rounded-lg overflow-hidden h-[calc(100vh-280px)] xl:h-[calc(100vh-240px)] flex items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const LazyResultsMap: React.FC<LazyResultsMapProps> = (props) => {
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <ResultsMap {...props} />
    </Suspense>
  );
};

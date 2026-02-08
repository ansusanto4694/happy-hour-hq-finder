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
  isLoading?: boolean;
}

// Loading fallback for JS bundle loading (Suspense)
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

// Data loading fallback (waiting for search results)
const MapDataLoadingFallback: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Finding happy hours...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Map View</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="rounded-lg overflow-hidden h-[75vh] max-h-[900px] flex items-center justify-center bg-muted animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Finding restaurants...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const LazyResultsMap: React.FC<LazyResultsMapProps> = ({ isLoading, ...props }) => {
  // Show data loading fallback when waiting for initial search results
  if (isLoading && (!props.restaurants || props.restaurants.length === 0)) {
    return <MapDataLoadingFallback isMobile={props.isMobile} />;
  }

  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <ResultsMap {...props} isLoading={isLoading} />
    </Suspense>
  );
};

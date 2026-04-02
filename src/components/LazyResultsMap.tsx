import React, { lazy, Suspense, Component } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

// Dedicated error boundary for map crashes (WebGL context loss, OOM)
// Prevents full-page "Something went wrong" when only the map fails
interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapErrorBoundary extends Component<{ children: React.ReactNode; isMobile?: boolean }, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[MapErrorBoundary] Map crashed:', error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.isMobile) {
        return (
          <div className="h-full w-full flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Map couldn't load</p>
              <p className="text-xs text-muted-foreground">Try switching to list view or tap retry</p>
              <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
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
            <div className="rounded-lg overflow-hidden h-[75vh] max-h-[900px] flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-3 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Map couldn't load</p>
                <p className="text-xs text-muted-foreground max-w-xs">This can happen on devices with limited memory. Try refreshing or use list view.</p>
                <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export const LazyResultsMap: React.FC<LazyResultsMapProps> = ({ isLoading, ...props }) => {
  // Show data loading fallback when waiting for initial search results
  if (isLoading && (!props.restaurants || props.restaurants.length === 0)) {
    return <MapDataLoadingFallback isMobile={props.isMobile} />;
  }

  return (
    <MapErrorBoundary isMobile={props.isMobile}>
      <Suspense fallback={<MapLoadingFallback />}>
        <ResultsMap {...props} isLoading={isLoading} />
      </Suspense>
    </MapErrorBoundary>
  );
};

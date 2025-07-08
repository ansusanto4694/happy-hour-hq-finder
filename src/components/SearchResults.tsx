
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { SearchResultsLoading } from './SearchResultsLoading';
import { SearchResultsError } from './SearchResultsError';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchResultCard } from './SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SearchResultsProps {
  merchants?: any[];
  isLoading?: boolean;
  error?: any;
  startTime?: string;
  endTime?: string;
  zipCode?: string;
  isMobile?: boolean;
}

const RESULTS_PER_PAGE = 20;

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  zipCode,
  isMobile = false
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Extract search term from URL parameters
  const searchTerm = searchParams.get('search') || '';
  
  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Reset displayed results when merchants change
  useEffect(() => {
    if (merchants) {
      const initialResults = merchants.slice(0, RESULTS_PER_PAGE);
      setDisplayedResults(initialResults);
      setHasMore(merchants.length > RESULTS_PER_PAGE);
    }
  }, [merchants]);

  // Load more results when scrolling to bottom (mobile only)
  useEffect(() => {
    if (inView && hasMore && !loadingMore && isMobile && displayedResults.length > 0) {
      loadMore();
    }
  }, [inView, hasMore, loadingMore, isMobile, displayedResults.length]);

  const loadMore = () => {
    if (!merchants || loadingMore) return;
    
    setLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const currentLength = displayedResults.length;
      const nextResults = merchants.slice(currentLength, currentLength + RESULTS_PER_PAGE);
      
      setDisplayedResults(prev => [...prev, ...nextResults]);
      setHasMore(currentLength + nextResults.length < merchants.length);
      setLoadingMore(false);
    }, 500);
  };

  if (isLoading) {
    return <SearchResultsLoading />;
  }

  if (error) {
    return <SearchResultsError />;
  }

  if (!merchants || merchants.length === 0) {
    return (
      <SearchResultsEmpty 
        startTime={startTime} 
        endTime={endTime} 
        zipCode={zipCode} 
      />
    );
  }

  const totalResults = merchants.length;
  const resultsToShow = isMobile ? displayedResults : merchants;

  return (
    <div className="space-y-4">
      <SearchResultsHeader 
        resultsCount={totalResults}
        startTime={startTime}
        endTime={endTime}
        zipCode={zipCode}
        currentPage={isMobile ? 1 : Math.ceil(displayedResults.length / RESULTS_PER_PAGE)}
        totalPages={isMobile ? 1 : Math.ceil(totalResults / RESULTS_PER_PAGE)}
        resultsPerPage={RESULTS_PER_PAGE}
        searchTerm={searchTerm}
        isMobile={isMobile}
      />
      
      <div className="space-y-3">
        {resultsToShow.map((restaurant) => (
          <SearchResultCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={handleRestaurantClick}
          />
        ))}
      </div>

      {/* Infinite scroll loading trigger (mobile only) */}
      {isMobile && hasMore && (
        <div ref={ref} className="flex justify-center py-4">
          {loadingMore && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more results...
            </div>
          )}
        </div>
      )}

      {/* Desktop pagination */}
      {!isMobile && totalResults > RESULTS_PER_PAGE && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={loadingMore || !hasMore}
            variant="outline"
            className="w-full max-w-xs"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : hasMore ? (
              `Load More (${totalResults - displayedResults.length} remaining)`
            ) : (
              'All results loaded'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

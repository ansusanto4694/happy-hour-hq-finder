
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { SearchResultsLoading } from './SearchResultsLoading';
import { SearchResultsError } from './SearchResultsError';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchResultCard } from './SearchResultCard';
import { Loader2 } from 'lucide-react';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

interface SearchResultsProps {
  merchants?: any[];
  isLoading?: boolean;
  error?: any;
  startTime?: string;
  endTime?: string;
  location?: string;
  isMobile?: boolean;
  onRestaurantHover?: (restaurantId: number | null) => void;
  onMerchantNavigate?: (merchantId: number) => void;
  happeningNow?: boolean;
  happeningToday?: boolean;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  hasLocalMerchants?: boolean;
}

const RESULTS_PER_PAGE = 30;

const SearchResultsComponent: React.FC<SearchResultsProps> = ({
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  location,
  isMobile = false,
  onRestaurantHover,
  onMerchantNavigate,
  happeningNow = false,
  happeningToday = false,
  sortBy,
  onSortChange,
  hasLocalMerchants = false,
}) => {
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Extract search term and page from URL parameters
  const searchTerm = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Reset displayed results when merchants change
  // Also check for scroll restoration target and load enough results to include it
  useEffect(() => {
    if (merchants) {
      // Check if we need to restore scroll to a specific merchant
      const savedState = sessionStorage.getItem('drawer-state');
      let targetMerchantId: number | null = null;
      
      if (savedState) {
        try {
          const states = JSON.parse(savedState);
          const locationKey = window.location.pathname + window.location.search;
          const state = states[locationKey];
          if (state?.lastClickedMerchantId) {
            targetMerchantId = state.lastClickedMerchantId;
          }
        } catch (e) {
          console.error('[SearchResults] Failed to parse drawer state:', e);
        }
      }
      
      // If we have a target merchant, find its index and load enough results
      if (targetMerchantId && isMobile) {
        const targetIndex = merchants.findIndex(m => m.id === targetMerchantId);
        console.log('[SearchResults] Scroll restoration target:', { targetMerchantId, targetIndex });
        
        if (targetIndex >= 0) {
          // Load all results up to and including the target, plus a buffer
          const resultsNeeded = Math.min(targetIndex + 10, merchants.length);
          const initialResults = merchants.slice(0, Math.max(RESULTS_PER_PAGE, resultsNeeded));
          setDisplayedResults(initialResults);
          setHasMore(initialResults.length < merchants.length);
          return;
        }
      }
      
      // Default: load first page
      const initialResults = merchants.slice(0, RESULTS_PER_PAGE);
      setDisplayedResults(initialResults);
      setHasMore(merchants.length > RESULTS_PER_PAGE);
    }
  }, [merchants, isMobile]);

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
        location={location}
        hasLocalMerchants={hasLocalMerchants}
      />
    );
  }

  const totalResults = merchants.length;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  
  // Ensure currentPage is valid - reset to 1 if out of bounds
  const validatedPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  
  const startIndex = (validatedPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = merchants.slice(startIndex, endIndex);
  const resultsToShow = isMobile ? displayedResults : paginatedResults;

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', page.toString());
    }
    setSearchParams(newParams, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, validatedPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={validatedPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={validatedPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={validatedPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <SearchResultsHeader 
        resultsCount={totalResults}
        startTime={startTime}
        endTime={endTime}
        location={location}
        currentPage={isMobile ? 1 : validatedPage}
        totalPages={isMobile ? 1 : totalPages}
        resultsPerPage={RESULTS_PER_PAGE}
        searchTerm={searchTerm}
        isMobile={isMobile}
        happeningNow={happeningNow}
        happeningToday={happeningToday}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
      
      <div className={isMobile ? "space-y-0" : "space-y-3"}>
        {resultsToShow.map((restaurant) => (
          <SearchResultCard
            key={restaurant.id}
            restaurant={restaurant}
            isMobile={isMobile}
            onHover={onRestaurantHover}
            onNavigate={onMerchantNavigate}
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
      {!isMobile && totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, validatedPage - 1))}
                  className={validatedPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, validatedPage + 1))}
                  className={validatedPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const SearchResults = React.memo(SearchResultsComponent, (prevProps, nextProps) => {
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.merchants === nextProps.merchants &&
    prevProps.startTime === nextProps.startTime &&
    prevProps.endTime === nextProps.endTime &&
    prevProps.location === nextProps.location &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.onRestaurantHover === nextProps.onRestaurantHover &&
    prevProps.onMerchantNavigate === nextProps.onMerchantNavigate &&
    prevProps.happeningNow === nextProps.happeningNow &&
    prevProps.happeningToday === nextProps.happeningToday &&
    prevProps.sortBy === nextProps.sortBy &&
    prevProps.onSortChange === nextProps.onSortChange &&
    prevProps.hasLocalMerchants === nextProps.hasLocalMerchants
  );
});


import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { SearchResultsLoading } from './SearchResultsLoading';
import { SearchResultsError } from './SearchResultsError';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchResultCard } from './SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';
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
}

const RESULTS_PER_PAGE = 30;

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  location,
  isMobile = false,
  onRestaurantHover
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();
  const [displayedResults, setDisplayedResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Extract search term from URL parameters
  const searchTerm = searchParams.get('search') || '';
  
  // Add comprehensive error handling and logging
  try {
    console.log('=== SEARCH RESULTS COMPONENT RENDER ===');
    console.log('Props received:');
    console.log('- isLoading:', isLoading);
    console.log('- error:', error);
    console.log('- merchants:', merchants);
    console.log('- merchants length:', merchants?.length || 0);
    console.log('- merchants type:', typeof merchants);
    console.log('- merchants is array:', Array.isArray(merchants));
    console.log('- search term from URL:', searchTerm);
    console.log('==========================================');
  } catch (e) {
    console.error('Error in SearchResults logging:', e);
  }
  
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

  console.log('=== SEARCH RESULTS DEBUG ===');
  console.log('Props received:');
  console.log('- isLoading:', isLoading);
  console.log('- error:', error);
  console.log('- merchants:', merchants);
  console.log('- merchants length:', merchants?.length || 0);
  console.log('- merchants type:', typeof merchants);
  console.log('- merchants is array:', Array.isArray(merchants));
  console.log('- search term from URL:', searchTerm);
  console.log('============================');

  if (isLoading) {
    return <SearchResultsLoading />;
  }

  if (error) {
    return <SearchResultsError />;
  }

  if (!merchants || merchants.length === 0) {
    console.log('Showing empty results because merchants is:', merchants);
    return (
      <SearchResultsEmpty 
        startTime={startTime} 
        endTime={endTime} 
        location={location} 
      />
    );
  }

  const totalResults = merchants.length;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = merchants.slice(startIndex, endIndex);
  const resultsToShow = isMobile ? displayedResults : paginatedResults;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
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
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
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
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
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
        currentPage={isMobile ? 1 : currentPage}
        totalPages={isMobile ? 1 : totalPages}
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
            isMobile={isMobile}
            onHover={onRestaurantHover}
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
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

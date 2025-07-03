
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchResultsLoading } from './SearchResultsLoading';
import { SearchResultsError } from './SearchResultsError';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchResultCard } from './SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';
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
  zipCode?: string;
}

const RESULTS_PER_PAGE = 20;

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  zipCode 
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  
  // Extract search term from URL parameters
  const searchTerm = searchParams.get('search') || '';

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

  // Calculate pagination
  const totalResults = merchants.length;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const currentResults = merchants.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
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

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis and last page if needed
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
        zipCode={zipCode}
        currentPage={currentPage}
        totalPages={totalPages}
        resultsPerPage={RESULTS_PER_PAGE}
        searchTerm={searchTerm}
      />
      
      <div className="space-y-3">
        {currentResults.map((restaurant) => (
          <SearchResultCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={handleRestaurantClick}
          />
        ))}
      </div>

      {totalPages > 1 && (
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

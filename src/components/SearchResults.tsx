
import React from 'react';
import { SearchResultsLoading } from './SearchResultsLoading';
import { SearchResultsError } from './SearchResultsError';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchResultCard } from './SearchResultCard';
import { useSearchResultsNavigation } from '@/hooks/useSearchResultsNavigation';

interface SearchResultsProps {
  merchants?: any[];
  isLoading?: boolean;
  error?: any;
  startTime?: string;
  endTime?: string;
  zipCode?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  zipCode 
}) => {
  const { handleRestaurantClick } = useSearchResultsNavigation();

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

  return (
    <div className="space-y-4">
      <SearchResultsHeader 
        resultsCount={merchants.length}
        startTime={startTime}
        endTime={endTime}
        zipCode={zipCode}
      />
      
      <div className="space-y-3">
        {merchants.map((restaurant) => (
          <SearchResultCard
            key={restaurant.id}
            restaurant={restaurant}
            onClick={handleRestaurantClick}
          />
        ))}
      </div>
    </div>
  );
};

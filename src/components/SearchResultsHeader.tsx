
import React from 'react';

interface SearchResultsHeaderProps {
  resultsCount: number;
  startTime?: string;
  endTime?: string;
  zipCode?: string;
  currentPage?: number;
  totalPages?: number;
  resultsPerPage?: number;
  searchTerm?: string;
  isMobile?: boolean;
}

export const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  resultsCount,
  startTime,
  endTime,
  zipCode,
  currentPage = 1,
  totalPages = 1,
  resultsPerPage = 20,
  searchTerm,
  isMobile = false
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, resultsCount);

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Happy Hour Results
            {searchTerm && <span className="text-orange-600"> for "{searchTerm}"</span>}
          </h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              {isMobile ? 
                `${resultsCount} restaurants found` : 
                `Showing ${startResult}-${endResult} of ${resultsCount} restaurants${totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}`
              }
            </p>
            {(startTime || endTime || zipCode || searchTerm) && (
              <div className="flex flex-wrap gap-4 text-xs">
                {searchTerm && (
                  <span>Search: "{searchTerm}"</span>
                )}
                {startTime && endTime && (
                  <span>Time: {formatTime(startTime)} - {formatTime(endTime)}</span>
                )}
                {zipCode && (
                  <span>Location: {zipCode}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';

interface SearchResultsHeaderProps {
  resultsCount: number;
  startTime?: string;
  endTime?: string;
  zipCode?: string;
}

export const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({ 
  resultsCount, 
  startTime, 
  endTime, 
  zipCode 
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">
        Happy Hour Results
        {(startTime && endTime) || zipCode ? (
          <span className="text-base font-normal text-gray-600 ml-2">
            ({startTime && endTime ? `${startTime} - ${endTime} today` : ''}
            {startTime && endTime && zipCode ? ', ' : ''}
            {zipCode ? `zip code ${zipCode}` : ''})
          </span>
        ) : null}
      </h2>
      <p className="text-gray-500">
        {resultsCount} results found
      </p>
    </div>
  );
};

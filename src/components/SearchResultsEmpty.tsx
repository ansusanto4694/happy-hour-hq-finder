
import React from 'react';

interface SearchResultsEmptyProps {
  startTime?: string;
  endTime?: string;
  zipCode?: string;
}

export const SearchResultsEmpty: React.FC<SearchResultsEmptyProps> = ({ 
  startTime, 
  endTime, 
  zipCode 
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">No restaurants found</h2>
      <p className="text-gray-600">
        {startTime && endTime 
          ? `No restaurants found with happy hours that overlap with ${startTime} - ${endTime} today${zipCode ? ` in zip code ${zipCode}` : ''}.`
          : `No restaurants are available${zipCode ? ` in zip code ${zipCode}` : ''} at this time.`
        }
      </p>
    </div>
  );
};

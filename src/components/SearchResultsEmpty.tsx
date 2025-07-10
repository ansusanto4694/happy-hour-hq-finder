
import React from 'react';

interface SearchResultsEmptyProps {
  startTime?: string;
  endTime?: string;
  location?: string;
}

export const SearchResultsEmpty: React.FC<SearchResultsEmptyProps> = ({ 
  startTime, 
  endTime, 
  location 
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">No restaurants found</h2>
      <p className="text-gray-600">
        {startTime && endTime 
          ? `No restaurants found with happy hours that overlap with ${startTime} - ${endTime} today${location ? ` in ${location}` : ''}.`
          : `No restaurants are available${location ? ` in ${location}` : ''} at this time.`
        }
      </p>
    </div>
  );
};

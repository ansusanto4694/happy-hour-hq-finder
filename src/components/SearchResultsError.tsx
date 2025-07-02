
import React from 'react';

export const SearchResultsError: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Error loading restaurants</h2>
      <p className="text-red-600">Please try again later.</p>
    </div>
  );
};

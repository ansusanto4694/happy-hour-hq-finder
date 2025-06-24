
import React from 'react';
import { FilterSection } from '../components/FilterSection';
import { SearchResults } from '../components/SearchResults';
import { ResultsMap } from '../components/ResultsMap';

const Results = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with company name */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Happy.Hour</h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          {/* Filters sidebar - left */}
          <div className="xl:col-span-3 order-1">
            <FilterSection />
          </div>
          
          {/* Search results - middle */}
          <div className="xl:col-span-6 order-2">
            <SearchResults />
          </div>
          
          {/* Map - right */}
          <div className="xl:col-span-3 order-3">
            <ResultsMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

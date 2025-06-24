
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-3">
            <FilterSection />
          </div>
          
          {/* Search results */}
          <div className="lg:col-span-6">
            <SearchResults />
          </div>
          
          {/* Map */}
          <div className="lg:col-span-3">
            <ResultsMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

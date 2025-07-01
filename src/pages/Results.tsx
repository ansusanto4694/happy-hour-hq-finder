
import React, { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { FilterSection } from '@/components/FilterSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: merchants, isLoading, error } = useMerchants(selectedCategories);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
              <FilterSection />
            </div>
          </div>

          {/* Results and Map */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Results List */}
              <div className="xl:col-span-1">
                {isLoading ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Loading restaurants...</h2>
                  </div>
                ) : error ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Error loading restaurants</h2>
                    <p className="text-red-600">Please try again later.</p>
                  </div>
                ) : (
                  <SearchResults />
                )}
              </div>

              {/* Map */}
              <div className="xl:col-span-1">
                <ResultsMap />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

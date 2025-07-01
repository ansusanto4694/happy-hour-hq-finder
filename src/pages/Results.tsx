
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
                <SearchResults 
                  merchants={merchants || []} 
                  isLoading={isLoading} 
                  error={error} 
                />
              </div>

              {/* Map */}
              <div className="xl:col-span-1">
                <ResultsMap merchants={merchants || []} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

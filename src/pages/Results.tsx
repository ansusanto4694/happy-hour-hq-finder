
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { FilterSection } from '@/components/FilterSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { data: merchants, isLoading, error } = useMerchants(selectedCategories);
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors absolute left-4"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
            <div className="max-w-4xl">
              <SearchBar />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Mobile/Small Screen Layout - Filters at Top */}
        <div className="xl:hidden max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-3">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
            />
          </div>

          {/* Results and Map Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-1">
              <SearchResults 
                merchants={merchants}
                isLoading={isLoading}
                error={error}
              />
            </div>
            <div className="lg:col-span-1">
              <ResultsMap />
            </div>
          </div>
        </div>

        {/* Large Screen Layout - Full Width with Filters on Far Left */}
        <div className="hidden xl:flex xl:gap-6 xl:h-[calc(100vh-200px)]">
          {/* Far Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6 h-fit">
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>
          </div>

          {/* Main Content Area - Results */}
          <div className="flex-1 min-w-0">
            <SearchResults 
              merchants={merchants}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Right Side - Map */}
          <div className="w-80 flex-shrink-0">
            <ResultsMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { FilterSection } from '@/components/FilterSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // Changed to string array
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

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Category Filters at Top */}
        <div className="bg-white rounded-lg shadow-sm p-3">
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />
        </div>

        {/* Results and Map Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Results List - Left Side */}
          <div className="lg:col-span-1">
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

          {/* Map - Right Side */}
          <div className="lg:col-span-1">
            <ResultsMap />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

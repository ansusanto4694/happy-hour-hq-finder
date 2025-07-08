
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { MobileSearchBar } from '@/components/MobileSearchBar';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { ViewToggle } from '@/components/ViewToggle';
import { SearchResults } from '@/components/SearchResults';
import { FilterSection } from '@/components/FilterSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';
import { useIsMobile } from '@/hooks/use-mobile';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Extract search parameters
  const searchTerm = searchParams.get('search') || '';
  const zipCode = searchParams.get('zip') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';

  const { data: merchants, isLoading, error } = useMerchants(selectedCategories, searchTerm, startTime, endTime);

  const handleGoHome = () => {
    navigate('/');
  };

  // Handle map bounds change to potentially filter results
  const handleMapMove = (bounds: { north: number; south: number; east: number; west: number }) => {
    // For now, we'll just log the bounds - you can implement location-based filtering later
    console.log('Map moved to bounds:', bounds);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-center">
            <h1 
              className="text-xl md:text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors absolute left-4"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
            <div className="max-w-4xl w-full">
              {isMobile ? <MobileSearchBar /> : <SearchBar />}
            </div>
          </div>
        </div>
      </div>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-24 md:pt-32 px-4 py-6">
        {/* Mobile Layout (< 768px) */}
        {isMobile && (
          <div className="max-w-7xl mx-auto">
            {/* Fixed Mobile Controls */}
            <div className="sticky top-24 md:top-32 z-40 bg-gray-50 pb-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <MobileFilterDrawer
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                />
                <ViewToggle view={mobileView} onViewChange={setMobileView} />
              </div>
            </div>

            {/* Mobile Content */}
            {mobileView === 'list' ? (
              <SearchResults 
                merchants={merchants}
                isLoading={isLoading}
                error={error}
                startTime={startTime}
                endTime={endTime}
                zipCode={zipCode}
                isMobile={true}
              />
            ) : (
              <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden">
                <ResultsMap 
                  restaurants={merchants || []}
                  onMapMove={handleMapMove}
                />
              </div>
            )}
          </div>
        )}

        {/* Tablet Layout (768px - 1280px) */}
        {!isMobile && (
          <div className="xl:hidden max-w-7xl mx-auto space-y-6">
            {/* Tablet Controls */}
            <div className="flex items-center justify-between">
              <div className="bg-white rounded-lg shadow-sm p-3">
                <CategoryFilter
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                />
              </div>
            </div>

            {/* Tablet Results and Map Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <SearchResults 
                  merchants={merchants}
                  isLoading={isLoading}
                  error={error}
                  startTime={startTime}
                  endTime={endTime}
                  zipCode={zipCode}
                />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-48 z-30">
                  <ResultsMap 
                    restaurants={merchants || []}
                    onMapMove={handleMapMove}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout (> 1280px) */}
        <div className="hidden xl:flex xl:gap-6">
          {/* Fixed Far Left Sidebar - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-32 z-40">
              <CategoryFilter
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
              />
            </div>
          </div>

          {/* Scrollable Main Content Area - Results */}
          <div className="flex-1 min-w-0">
            <SearchResults 
              merchants={merchants}
              isLoading={isLoading}
              error={error}
              startTime={startTime}
              endTime={endTime}
              zipCode={zipCode}
            />
          </div>

          {/* Fixed Right Side - Map */}
          <div className="w-[36rem] flex-shrink-0">
            <div className="sticky top-32 z-30">
              <ResultsMap 
                restaurants={merchants || []}
                onMapMove={handleMapMove}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

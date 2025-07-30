
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { MobileSearchBar } from '@/components/MobileSearchBar';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { ViewToggle } from '@/components/ViewToggle';
import { SearchResults } from '@/components/SearchResults';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadiusOption, getRadiusMiles } from '@/components/RadiusFilter';
import { AuthButton } from '@/components/AuthButton';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>('walking');
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [searchAsMapMoves, setSearchAsMapMoves] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  // Persist map view state across view toggles
  const [mapViewState, setMapViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Extract search parameters
  const searchTerm = searchParams.get('search') || '';
  const location = searchParams.get('location') || searchParams.get('zip') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';

  // Check if radius filtering should be enabled (any location provided)
  const isRadiusEnabled = Boolean(location && location.trim());
  const radiusMiles = getRadiusMiles(selectedRadius);

  const { data: merchants, isLoading, error } = useMerchants(
    selectedCategories, 
    searchTerm, 
    startTime, 
    endTime, 
    location,
    searchAsMapMoves ? mapBounds : undefined,
    isRadiusEnabled ? radiusMiles : undefined,
    showOffersOnly
  );

  // Debug the merchants data being passed to SearchResults - ALWAYS LOG
  console.log('=== RESULTS PAGE DEBUG ===');
  console.log('Search term from URL:', searchTerm);
  console.log('Merchants data from hook:', merchants);
  console.log('Merchants count from hook:', merchants?.length || 0);
  console.log('Is loading:', isLoading);
  console.log('Error:', error);
  console.log('Selected categories:', selectedCategories);
  console.log('Location:', location);
  console.log('========================');

  // Force re-render when data changes
  React.useEffect(() => {
    console.log('=== RESULTS EFFECT TRIGGERED ===');
    console.log('Merchants updated:', merchants?.length || 0);
    console.log('================================');
  }, [merchants]);

  const handleGoHome = () => {
    navigate('/');
  };

  // Handle map bounds change to potentially filter results
  const handleMapMove = (bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    if (searchAsMapMoves) {
      console.log('Map moved to bounds, updating search:', bounds);
    }
  };

  // Handle map view state changes to persist across view toggles
  const handleViewStateChange = (newViewState: { longitude: number; latitude: number; zoom: number }) => {
    setMapViewState(newViewState);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-center relative">
            {!isMobile && (
              <h1 
                className="text-xl md:text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors absolute left-4"
                onClick={handleGoHome}
              >
                SipMunchYap
              </h1>
            )}
            <div className="max-w-4xl w-full">
              {isMobile ? <MobileSearchBar /> : <SearchBar variant="results" />}
            </div>
            <div className="absolute right-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </div>

      {/* Content with top padding to account for fixed header */}
      <div className="pt-32 md:pt-32 px-4 py-6">
        {/* Mobile Layout (< 768px) */}
        {isMobile && (
          <div className="max-w-7xl mx-auto">
            {/* Fixed Mobile Controls */}
            <div className="sticky top-32 md:top-32 z-40 bg-gray-50 pb-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <MobileFilterDrawer
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  selectedRadius={selectedRadius}
                  onRadiusChange={setSelectedRadius}
                  isRadiusEnabled={isRadiusEnabled}
                  showOffersOnly={showOffersOnly}
                  onShowOffersChange={setShowOffersOnly}
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
                location={location}
                isMobile={true}
              />
            ) : (
              <div className="h-[calc(100vh-220px)] rounded-lg overflow-hidden">
                <ResultsMap 
                  restaurants={merchants || []}
                  onMapMove={handleMapMove}
                  searchAsMapMoves={searchAsMapMoves}
                  onToggleSearchAsMapMoves={setSearchAsMapMoves}
                  viewState={mapViewState}
                  onViewStateChange={handleViewStateChange}
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
                <UnifiedFilterBar
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  selectedRadius={selectedRadius}
                  onRadiusChange={setSelectedRadius}
                  isRadiusEnabled={isRadiusEnabled}
                  showOffersOnly={showOffersOnly}
                  onShowOffersChange={setShowOffersOnly}
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
                  location={location}
                />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-48 z-30">
                  <ResultsMap 
                    restaurants={merchants || []}
                    onMapMove={handleMapMove}
                    searchAsMapMoves={searchAsMapMoves}
                    onToggleSearchAsMapMoves={setSearchAsMapMoves}
                    viewState={mapViewState}
                    onViewStateChange={handleViewStateChange}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layout (> 1280px) */}
        <div className="hidden xl:flex xl:gap-6">
          {/* Fixed Far Left Sidebar - Unified Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="space-y-4 sticky top-32 z-40">
              <UnifiedFilterBar
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                selectedRadius={selectedRadius}
                onRadiusChange={setSelectedRadius}
                isRadiusEnabled={isRadiusEnabled}
                showOffersOnly={showOffersOnly}
                onShowOffersChange={setShowOffersOnly}
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
              location={location}
            />
          </div>

          {/* Fixed Right Side - Map */}
          <div className="w-[28rem] flex-shrink-0">
            <div className="sticky top-32 z-30">
              <ResultsMap 
                restaurants={merchants || []}
                onMapMove={handleMapMove}
                searchAsMapMoves={searchAsMapMoves}
                onToggleSearchAsMapMoves={setSearchAsMapMoves}
                viewState={mapViewState}
                onViewStateChange={handleViewStateChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

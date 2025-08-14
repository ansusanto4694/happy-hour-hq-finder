
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { MobileSearchBar } from '@/components/MobileSearchBar';
import { MobileListDrawer } from '@/components/MobileListDrawer';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';
import { SearchResults } from '@/components/SearchResults';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadiusOption, getRadiusMiles } from '@/components/RadiusFilter';
import { AuthButton } from '@/components/AuthButton';
import { SEOHead } from '@/components/SEOHead';

const Results = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>('walking');
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [searchAsMapMoves, setSearchAsMapMoves] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [selectedDaysState, setSelectedDaysState] = useState<number[]>([]);
  const [startTimeState, setStartTimeState] = useState(searchParams.get('startTime') || '');
  const [endTimeState, setEndTimeState] = useState(searchParams.get('endTime') || '');
  // Persist map view state across view toggles
  const [mapViewState, setMapViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });

  // Extract search parameters
  const searchTerm = searchParams.get('search') || '';
  const location = searchParams.get('location') || searchParams.get('zip') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';
  const selectedDays = (() => {
    const daysParam = searchParams.get('days');
    return daysParam ? daysParam.split(',').map(Number) : [];
  })();

  // Handle day change with URL update
  const handleDaysChange = (days: number[]) => {
    setSelectedDaysState(days);
    const newSearchParams = new URLSearchParams(searchParams);
    if (days.length > 0) {
      newSearchParams.set('days', days.join(','));
    } else {
      newSearchParams.delete('days');
    }
    setSearchParams(newSearchParams);
  };

  // Handle time changes with URL update
  const handleStartTimeChange = (time: string) => {
    setStartTimeState(time);
    const newSearchParams = new URLSearchParams(searchParams);
    if (time) {
      newSearchParams.set('startTime', time);
    } else {
      newSearchParams.delete('startTime');
    }
    setSearchParams(newSearchParams);
  };

  const handleEndTimeChange = (time: string) => {
    setEndTimeState(time);
    const newSearchParams = new URLSearchParams(searchParams);
    if (time) {
      newSearchParams.set('endTime', time);
    } else {
      newSearchParams.delete('endTime');
    }
    setSearchParams(newSearchParams);
  };

  // Check if radius filtering should be enabled (any location provided)
  const isRadiusEnabled = Boolean(location && location.trim());
  const radiusMiles = getRadiusMiles(selectedRadius);

  // Use filter state or URL params for time values  
  const currentStartTime = startTimeState || startTime;
  const currentEndTime = endTimeState || endTime;

  const { data: merchants, isLoading, error } = useMerchants(
    selectedCategories, 
    searchTerm, 
    currentStartTime, 
    currentEndTime, 
    location,
    searchAsMapMoves ? mapBounds : undefined,
    isRadiusEnabled ? radiusMiles : undefined,
    showOffersOnly,
    selectedDays
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

  // Prevent body scroll on mobile
  React.useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isMobile]);

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

  const seoTitle = location 
    ? `Happy Hour in ${location} - Find the Best Deals | SipMunchYap`
    : `Happy Hour Search Results | SipMunchYap`;
  
  const seoDescription = location
    ? `Find the best happy hour deals in ${location}. Compare prices, discover local bars and restaurants, and save money on drinks and food.`
    : `Discover amazing happy hour deals near you. Compare prices and find the best bars and restaurants for your night out.`;

  return (
    <div className={`${isMobile ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-gray-50`}>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={`happy hour ${location}, bars ${location}, restaurants ${location}, drink deals, food specials, nightlife ${location}`}
        location={location}
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          "name": seoTitle,
          "description": seoDescription,
          "url": typeof window !== 'undefined' ? window.location.href : '',
          "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": merchants?.length || 0,
            "itemListElement": merchants?.map((merchant, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Restaurant",
                "name": merchant.restaurant_name,
                "address": `${merchant.city}, ${merchant.state}`,
                "telephone": merchant.phone_number,
                "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/restaurant/${merchant.id}`
              }
            })) || []
          }
        }}
      />
      {/* Fixed Header */}
      <div className={`bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50 ${isMobile ? 'h-16' : ''}`}>
        <div className={`px-4 ${isMobile ? 'py-2' : 'py-4 md:py-6'}`}>
          <div className="flex items-center justify-between">
            {/* Logo - Left aligned */}
            {!isMobile && (
              <div className="flex-shrink-0">
                <h1 
                  className="text-xl md:text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors"
                  onClick={handleGoHome}
                >
                  SipMunchYap
                </h1>
              </div>
            )}
            
            {/* Search Bar - Center aligned */}
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-7xl">
                {isMobile ? <MobileSearchBar /> : <SearchBar variant="results" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Full Screen Map */}
      {isMobile && (
        <div className="fixed inset-0 pt-16 overflow-hidden">
          {/* Full Screen Map */}
          <div className="h-full w-full overflow-hidden">
            <ResultsMap 
              restaurants={merchants || []}
              onMapMove={handleMapMove}
              searchAsMapMoves={searchAsMapMoves}
              onToggleSearchAsMapMoves={setSearchAsMapMoves}
              viewState={mapViewState}
              onViewStateChange={handleViewStateChange}
              isMobile={true}
            />
          </div>
          
          {/* List Drawer with Peek Handle */}
          <MobileListDrawer
            trigger={
              <div 
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 cursor-pointer"
                style={{ height: 'calc(100vh / 8)' }}
              >
                <div className="flex items-center justify-center pt-3">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>
                <div className="px-4 pt-2">
                  <p className="text-sm text-gray-600 text-center font-medium">
                    {merchants?.length || 0} results • Swipe up for list
                  </p>
                </div>
              </div>
            }
            isOpen={isListDrawerOpen}
            onOpenChange={setIsListDrawerOpen}
            merchants={merchants || []}
            isLoading={isLoading}
            error={error}
            startTime={currentStartTime}
            endTime={currentEndTime}
            location={location}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            selectedRadius={selectedRadius}
            onRadiusChange={setSelectedRadius}
            isRadiusEnabled={isRadiusEnabled}
            showOffersOnly={showOffersOnly}
            onShowOffersChange={setShowOffersOnly}
            selectedDays={selectedDays}
            onDaysChange={handleDaysChange}
            onStartTimeChange={handleStartTimeChange}
            onEndTimeChange={handleEndTimeChange}
          />
        </div>
      )}

      {/* Desktop/Tablet Content with padding */}
      <div className={`${isMobile ? 'hidden' : 'pt-32 px-4 py-6'}`}>

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
                selectedDays={selectedDays}
                onDaysChange={handleDaysChange}
                startTime={currentStartTime}
                endTime={currentEndTime}
                onStartTimeChange={handleStartTimeChange}
                onEndTimeChange={handleEndTimeChange}
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
              startTime={currentStartTime}
              endTime={currentEndTime}
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
                  selectedDays={selectedDays}
                  onDaysChange={handleDaysChange}
                  startTime={currentStartTime}
                  endTime={currentEndTime}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                />
            </div>
          </div>

          {/* Scrollable Main Content Area - Results */}
          <div className="flex-1 min-w-0">
                 <SearchResults 
                  merchants={merchants}
                  isLoading={isLoading}
                  error={error}
                  startTime={currentStartTime}
                  endTime={currentEndTime}
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

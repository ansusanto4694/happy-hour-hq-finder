
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MobileResultsSearchBar } from '@/components/MobileResultsSearchBar';
import { MobileListDrawer } from '@/components/MobileListDrawer';
import { SearchResults } from '@/components/SearchResults';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';
import { LazyResultsMap } from '@/components/LazyResultsMap';
import { useMerchants } from '@/hooks/useMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadiusOption, getRadiusMiles } from '@/components/RadiusFilter';
import { AuthButton } from '@/components/AuthButton';
import { SEOHead } from '@/components/SEOHead';
import { PageHeader } from '@/components/PageHeader';
import { useDrawerScrollRestoration } from '@/hooks/useDrawerScrollRestoration';

const Results = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { track, trackFunnel } = useAnalytics();

  // Read filter state from URL params (persisted across navigation)
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const selectedRadius = (searchParams.get('radius') as RadiusOption) || 'walking';
  const showOffersOnly = searchParams.get('offers') === 'true';
  const selectedMenuType = (searchParams.get('menuType') as 'all' | 'food_and_drinks' | 'drinks_only') || 'all';

  // Drawer state will be initialized after merchants query - placeholder for now
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showSearchThisAreaDesktop, setShowSearchThisAreaDesktop] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [searchedBounds, setSearchedBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [isUsingMapSearch, setIsUsingMapSearch] = useState(false);
  // Persist map view state across view toggles
  const [mapViewState, setMapViewState] = useState({
    longitude: -73.9712,
    latitude: 40.7831,
    zoom: 12
  });
  // Track hovered restaurant for map icon highlighting (desktop only)
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<number | null>(null);

  // Helper functions to update filters in URL
  const setSelectedCategories = (categories: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (categories.length > 0) {
      newParams.set('categories', categories.join(','));
    } else {
      newParams.delete('categories');
    }
    setSearchParams(newParams, { replace: true });
  };

  const setSelectedRadius = (radius: RadiusOption) => {
    const newParams = new URLSearchParams(searchParams);
    if (radius !== 'walking') {
      newParams.set('radius', radius);
    } else {
      newParams.delete('radius');
    }
    setSearchParams(newParams, { replace: true });
  };

  const setShowOffersOnly = (show: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) {
      newParams.set('offers', 'true');
    } else {
      newParams.delete('offers');
    }
    setSearchParams(newParams, { replace: true });
  };

  const setSelectedMenuType = (menuType: 'all' | 'food_and_drinks' | 'drinks_only') => {
    const newParams = new URLSearchParams(searchParams);
    if (menuType !== 'all') {
      newParams.set('menuType', menuType);
    } else {
      newParams.delete('menuType');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Extract search parameters
  const searchTerm = searchParams.get('search') || '';
  const location = searchParams.get('location') || searchParams.get('zip') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';
  const useGPS = searchParams.get('useGPS') === 'true';
  const gpsLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const gpsLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const carouselId = searchParams.get('carousel') || undefined;
  const carouselName = searchParams.get('carouselName') || undefined;
  const selectedDays = (() => {
    const daysParam = searchParams.get('days');
    return daysParam ? daysParam.split(',').map(Number) : [];
  })();

  // Handle day change with URL update
  const handleDaysChange = (days: number[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (days.length > 0) {
      newSearchParams.set('days', days.join(','));
    } else {
      newSearchParams.delete('days');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Handle time changes with URL update
  const handleStartTimeChange = (time: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (time) {
      newSearchParams.set('startTime', time);
    } else {
      newSearchParams.delete('startTime');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  const handleEndTimeChange = (time: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (time) {
      newSearchParams.set('endTime', time);
    } else {
      newSearchParams.delete('endTime');
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Check if radius filtering should be enabled (location OR GPS coordinates provided)
  const isRadiusEnabled = Boolean((location && location.trim()) || (useGPS && gpsLat && gpsLng));
  // Use selected radius for both GPS and location-based searches
  const radiusMiles = getRadiusMiles(selectedRadius);

  // Time values directly from URL params
  const currentStartTime = startTime;
  const currentEndTime = endTime;

  const { data: merchants, isLoading, error } = useMerchants(
    selectedCategories, 
    searchTerm, 
    currentStartTime, 
    currentEndTime, 
    isUsingMapSearch ? undefined : location, // Clear location when using map search
    isUsingMapSearch ? searchedBounds : undefined, // Use the saved searched bounds, not live bounds
    isUsingMapSearch ? undefined : (isRadiusEnabled ? radiusMiles : undefined), // Clear radius when using map search
    showOffersOnly,
    selectedDays,
    useGPS && gpsLat && gpsLng ? { lat: gpsLat, lng: gpsLng } : undefined, // GPS coordinates
    carouselId, // Carousel filtering
    undefined, // neighborhood
    selectedMenuType // Menu type filter
  );

  // Use drawer scroll restoration hook for persistent drawer state
  // Pass content ready state so scroll restoration waits for merchants to render
  const isContentReady = !isLoading && (merchants?.length ?? 0) > 0;
  const { isOpen: isListDrawerOpen, setIsOpen: setIsListDrawerOpen, setLastClickedId } = useDrawerScrollRestoration({ isContentReady });
  useEffect(() => {
    track({
      eventType: 'page_view',
      eventCategory: 'page_view',
      eventAction: 'results_page_viewed',
      searchTerm: searchParams.get('search') || undefined,
      locationQuery: searchParams.get('location') || undefined,
      metadata: {
        hasFilters: selectedCategories.length > 0 || selectedDays.length > 0,
        categoryCount: selectedCategories.length,
        daysSelected: selectedDays.length,
        hasTimeFilter: !!startTime || !!endTime,
        radiusFilter: selectedRadius,
        useGPS: searchParams.get('useGPS') === 'true',
        resultsCount: merchants?.length || 0
      },
    });
    
    trackFunnel({
      funnelStep: 'results_viewed',
      stepOrder: 3
    });
  }, []);

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

  // Handle map bounds change to potentially filter results - memoized for stable reference
  const handleMapMove = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    
    // Show "search this area" button whenever the map moves, regardless of distance
    if (isMobile) {
      // Always show search button when map moves on mobile
      if (isUsingMapSearch && searchedBounds) {
        // Compare current bounds with searched bounds - any difference shows button
        const boundsChanged = 
          bounds.north !== searchedBounds.north ||
          bounds.south !== searchedBounds.south ||
          bounds.east !== searchedBounds.east ||
          bounds.west !== searchedBounds.west;
        
        if (boundsChanged) {
          setShowSearchThisArea(true);
        }
      } 
      // If this is the first move from initial position, show button
      else if (!hasMapMoved) {
        setHasMapMoved(true);
        setShowSearchThisArea(true);
      }
    } else {
      // On desktop, show "search this area" button whenever map moves
      if (isUsingMapSearch && searchedBounds) {
        // Compare current bounds with searched bounds - any difference shows button
        const boundsChanged = 
          bounds.north !== searchedBounds.north ||
          bounds.south !== searchedBounds.south ||
          bounds.east !== searchedBounds.east ||
          bounds.west !== searchedBounds.west;
        
        if (boundsChanged) {
          setShowSearchThisAreaDesktop(true);
        }
      } 
      // If this is the first move from initial position, show button
      else if (!hasMapMoved) {
        setHasMapMoved(true);
        setShowSearchThisAreaDesktop(true);
      }
    }
  }, [isMobile, isUsingMapSearch, searchedBounds, hasMapMoved]);

  // Handle search this area button click - memoized for stable reference
  const handleSearchThisArea = useCallback(async () => {
    await track({
      eventType: 'click',
      eventCategory: 'map_interaction',
      eventAction: 'search_area_clicked',
      metadata: {
        mapBounds: mapBounds,
        previousResultsCount: merchants?.length || 0
      },
    });

    setSearchedBounds(mapBounds);
    setIsUsingMapSearch(true);
    setShowSearchThisArea(false);
    setShowSearchThisAreaDesktop(false);
  }, [mapBounds, merchants?.length, track]);

  // Handle map view state changes to persist across view toggles - memoized for stable reference
  const handleViewStateChange = useCallback((newViewState: { longitude: number; latitude: number; zoom: number }) => {
    setMapViewState(newViewState);
  }, []);

  const seoTitle = carouselName 
    ? `${carouselName} - Featured Restaurants | SipMunchYap`
    : location 
      ? `Happy Hour in ${location} - Find the Best Deals | SipMunchYap`
      : `Happy Hour Search Results | SipMunchYap`;
  
  const seoDescription = carouselName
    ? `Discover our ${carouselName} collection of handpicked restaurants and bars. Find the best happy hour deals curated just for you.`
    : location
      ? `Find the best happy hour deals in ${location}. Compare prices, discover local bars and restaurants, and save money on drinks and food.`
      : `Discover amazing happy hour deals near you. Compare prices and find the best bars and restaurants for your night out.`;

  // Build canonical URL based on meaningful search parameters
  const buildCanonicalUrl = () => {
    const baseUrl = 'https://sipmunchyap.com/results';
    
    if (carouselId) {
      return `${baseUrl}?carousel=${carouselId}`;
    }
    
    if (location) {
      return `${baseUrl}?location=${encodeURIComponent(location)}`;
    }
    
    // For GPS-based searches, use base URL without parameters
    return baseUrl;
  };

  return (
    <div className={`${isMobile ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-gray-50`}>
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={carouselName ? `${carouselName}, featured restaurants, curated restaurants, happy hour deals` : `happy hour ${location}, bars ${location}, restaurants ${location}, drink deals, food specials, nightlife ${location}`}
        location={location}
        canonical={buildCanonicalUrl()}
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
                "url": `${typeof window !== 'undefined' ? window.location.origin : ''}/restaurant/${merchant.slug || merchant.id}`
              }
            })) || []
          }
        }}
      />
      {/* Fixed Header */}
      {isMobile ? (
        <div className="bg-background shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 h-16">
          <div className="px-4 py-2 flex items-center h-full">
            <div className="flex-1">
              <MobileResultsSearchBar onExpandedChange={setIsFilterDrawerOpen} />
            </div>
          </div>
        </div>
      ) : (
        <PageHeader 
          showSearchBar={true} 
          searchBarVariant="results" 
          onLogoClick={handleGoHome}
        />
      )}

      {/* Search This Area Button - Mobile Only */}
      {isMobile && showSearchThisArea && !isFilterDrawerOpen && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <button
            onClick={handleSearchThisArea}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium shadow-lg transition-colors duration-200"
          >
            Search this area
          </button>
        </div>
      )}

      {/* Mobile Layout - Full Screen Map */}
      {isMobile && (
        <div className="fixed inset-0 pt-16 overflow-hidden">
          {/* Full Screen Map */}
          <div className="h-full w-full overflow-hidden">
            <LazyResultsMap 
              restaurants={merchants || []}
              onMapMove={handleMapMove}
              showSearchThisArea={false} // Mobile uses fixed button
              onSearchThisArea={handleSearchThisArea}
              isUsingMapSearch={isUsingMapSearch}
              viewState={mapViewState}
              onViewStateChange={handleViewStateChange}
              isMobile={true}
              hoveredRestaurantId={hoveredRestaurantId}
              searchLocation={location}
            />
          </div>
          
          {/* Swipeable Peek Handle - positioned above bottom nav */}
          <div 
            className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50"
            style={{ height: 'calc(100vh / 8)' }}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleTouchMove = (moveE: TouchEvent) => {
                const currentY = moveE.touches[0].clientY;
                const deltaY = startY - currentY;
                if (deltaY > 50) { // Swipe up threshold
                  setIsListDrawerOpen(true);
                  document.removeEventListener('touchmove', handleTouchMove);
                }
              };
              const handleTouchEnd = () => {
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
              };
              document.addEventListener('touchmove', handleTouchMove);
              document.addEventListener('touchend', handleTouchEnd);
            }}
            onClick={() => setIsListDrawerOpen(true)}
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

          {/* List Drawer */}
          <MobileListDrawer
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
            onMerchantNavigate={setLastClickedId}
            onEndTimeChange={handleEndTimeChange}
            selectedMenuType={selectedMenuType}
            onMenuTypeChange={setSelectedMenuType}
          />
        </div>
      )}

      {/* Desktop/Tablet Content with padding */}
      <div className={`${isMobile ? 'hidden' : 'pt-40 px-4 py-6'}`}>

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
                selectedMenuType={selectedMenuType}
                onMenuTypeChange={setSelectedMenuType}
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
              onRestaurantHover={setHoveredRestaurantId}
            />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-48 z-30">
                  <LazyResultsMap 
                    restaurants={merchants || []}
                    onMapMove={handleMapMove}
                    showSearchThisArea={showSearchThisAreaDesktop}
                    onSearchThisArea={handleSearchThisArea}
                    isUsingMapSearch={isUsingMapSearch}
                    viewState={mapViewState}
                    onViewStateChange={handleViewStateChange}
                    hoveredRestaurantId={hoveredRestaurantId}
                    searchLocation={location}
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
            <div className="sticky top-32 z-40 max-h-[calc(100vh-9rem)] overflow-y-auto">
                <UnifiedFilterBar
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  selectedRadius={selectedRadius}
                  onRadiusChange={setSelectedRadius}
                  isRadiusEnabled={isRadiusEnabled}
                  useGPS={false}
                  showOffersOnly={showOffersOnly}
                  onShowOffersChange={setShowOffersOnly}
                  selectedDays={selectedDays}
                  onDaysChange={handleDaysChange}
                  startTime={currentStartTime}
                  endTime={currentEndTime}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                  selectedMenuType={selectedMenuType}
                  onMenuTypeChange={setSelectedMenuType}
                />
            </div>
          </div>

          {/* Scrollable Main Content Area - Results */}
          <div className="flex-1 min-w-[28rem]">
            <SearchResults 
              merchants={merchants}
              isLoading={isLoading}
              error={error}
              startTime={currentStartTime}
              endTime={currentEndTime}
              location={location}
              onRestaurantHover={setHoveredRestaurantId}
            />
          </div>

          {/* Flexible Right Side - Map */}
          <div className="flex-1 min-w-[32rem] 2xl:min-w-[36rem] max-w-[50rem]">
            <div className="sticky top-32 z-30">
                <LazyResultsMap 
                  restaurants={merchants || []}
                  onMapMove={handleMapMove}
                  showSearchThisArea={showSearchThisAreaDesktop}
                  onSearchThisArea={handleSearchThisArea}
                  isUsingMapSearch={isUsingMapSearch}
                  viewState={mapViewState}
                  onViewStateChange={handleViewStateChange}
                  hoveredRestaurantId={hoveredRestaurantId}
                  searchLocation={location}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;

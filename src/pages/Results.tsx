
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { MobileSearchBar } from '@/components/MobileSearchBar';
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer';

import { Drawer, DrawerContent, DrawerHandle, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { SearchResults } from '@/components/SearchResults';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';
import { ResultsMap } from '@/components/ResultsMap';
import { useMerchants } from '@/hooks/useMerchants';
import { useIsMobile } from '@/hooks/use-mobile';
import { RadiusOption, getRadiusMiles } from '@/components/RadiusFilter';
import { AuthButton } from '@/components/AuthButton';
import { SEOHead } from '@/components/SEOHead';
import { useLocateMe } from '@/hooks/useLocateMe';
import { X } from 'lucide-react';

const Results = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>('walking');
  const [showOffersOnly, setShowOffersOnly] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');
  const [searchAsMapMoves, setSearchAsMapMoves] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [selectedDaysState, setSelectedDaysState] = useState<number[]>([]);
  // Persist map view state across view toggles
  const [mapViewState, setMapViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });
  // Control Vaul snap point to allow dragging both up and down
  const [activeSnap, setActiveSnap] = useState<string | number>(0.12);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { locate } = useLocateMe();
  // Extract search parameters
  const searchTerm = searchParams.get('search') || '';
  const location = searchParams.get('location') || searchParams.get('zip') || '';
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';
  const selectedDays = (() => {
    const daysParam = searchParams.get('days');
    return daysParam ? daysParam.split(',').map(Number) : [];
  })();
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const coords = latParam && lngParam ? { latitude: parseFloat(latParam), longitude: parseFloat(lngParam) } : null;

  // On mobile, default to user's current city using LocateMe (GPS with IP fallback)
  React.useEffect(() => {
    if (!isMobile || location) return;
    (async () => {
      const r = await locate();
      if (r?.display) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('location', r.display);
        setSearchParams(newSearchParams);
        if (r.latitude && r.longitude) {
          setMapViewState({ longitude: r.longitude, latitude: r.latitude, zoom: 13 });
        }
      }
    })();
  }, [isMobile, location]);
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

  // Check if radius filtering should be enabled (any location provided)
  const isRadiusEnabled = Boolean(location && location.trim());
  const radiusMiles = getRadiusMiles(selectedRadius);

  const { data: merchants, isLoading, error } = useMerchants(
    selectedCategories, 
    searchTerm, 
    startTime, 
    endTime, 
    location,
    coords,
    searchAsMapMoves ? mapBounds || undefined : undefined,
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
    <div className="min-h-screen bg-gray-50">
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
      <div className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="px-4 py-4 md:py-6">
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

      {/* Content with top padding to account for fixed header */}
      <div className="pt-32 md:pt-32 px-4 py-6">
        {/* Mobile Layout (< 768px) */}
        {isMobile && (
          <>
            {!filtersOpen && (
              <Drawer shouldScaleBackground={false} open={true} dismissible={false} handleOnly snapPoints={[0.12, 0.6, 1]} activeSnapPoint={activeSnap} setActiveSnapPoint={setActiveSnap} snapToSequentialPoint fadeFromIndex={1}>
              <div className="max-w-7xl mx-auto">
              {/* Map - default visible unless Filters drawer is open (avoid mobile GPU crash) */}
              {!filtersOpen && (
                <ResultsMap
                  restaurants={merchants || []}
                  onMapMove={handleMapMove}
                  searchAsMapMoves={searchAsMapMoves}
                  onToggleSearchAsMapMoves={setSearchAsMapMoves}
                  viewState={mapViewState}
                  onViewStateChange={handleViewStateChange}
                />
              )}

            {/* Floating grab handle to ensure peek on mobile */}
            {!filtersOpen && (
              <DrawerHandle className="fixed bottom-[calc(env(safe-area-inset-bottom)+56px)] left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-full bg-background/90 shadow-lg backdrop-blur">
                <div className="pointer-events-none h-1.5 w-12 rounded-full bg-muted" />
              </DrawerHandle>
            )}
            </div>
            {!filtersOpen && (
              <DrawerContent className="max-h-[85vh]">
                <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 pb-4">
                  <SearchResults
                    merchants={merchants}
                    isLoading={isLoading}
                    error={error}
                    startTime={startTime}
                    endTime={endTime}
                    location={location}
                    isMobile={true}
                    headerRightContent={
                      <MobileFilterDrawer
                        selectedCategories={selectedCategories}
                        onCategoryChange={setSelectedCategories}
                        selectedRadius={selectedRadius}
                        onRadiusChange={setSelectedRadius}
                        isRadiusEnabled={isRadiusEnabled}
                        showOffersOnly={showOffersOnly}
                        onShowOffersChange={setShowOffersOnly}
                        selectedDays={selectedDays}
                        onDaysChange={handleDaysChange}
                        onOpenChange={setFiltersOpen}
                      />
                    }
                  />
                </div>
              </DrawerContent>
            )}
            </Drawer>)}

          {/* Filters Fullscreen Modal - avoids WebGL/drawer issues on mobile */}
          {filtersOpen && (
            <div className="fixed inset-0 z-[200]">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
              <div className="absolute inset-0 bg-background flex flex-col">
                <div className="relative border-b p-4">
                  <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} className="absolute left-4 top-3 p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                    <X className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-center">Filters</h2>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
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
                    vertical={true}
                  />
                </div>
              </div>
            </div>
          )}
          </>
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
                  selectedDays={selectedDays}
                  onDaysChange={handleDaysChange}
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
                selectedDays={selectedDays}
                onDaysChange={handleDaysChange}
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

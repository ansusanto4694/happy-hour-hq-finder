import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useCallback, useLayoutEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useMerchants } from '@/hooks/useMerchants';
import { SearchResults } from '@/components/SearchResults';
import { SearchResultCard } from '@/components/SearchResultCard';
import { SearchResultsLoading } from '@/components/SearchResultsLoading';
import { SearchResultsEmpty } from '@/components/SearchResultsEmpty';
import { UnifiedFilterBar } from '@/components/UnifiedFilterBar';

import { LazyResultsMap } from '@/components/LazyResultsMap';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Utensils, ChevronLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewToggle } from '@/components/ViewToggle';
import { MobileListDrawer } from '@/components/MobileListDrawer';
import { MobileResultsSearchBar } from '@/components/MobileResultsSearchBar';
import { useAnalytics } from '@/hooks/useAnalytics';
import NotFound from '@/pages/NotFound';
import { PageHeader } from '@/components/PageHeader';
import { RadiusOption, getRadiusMiles, getSmartDefaultRadius, inferLocationTypeFromInput } from '@/components/RadiusFilter';

// Helper function to convert slug to display name
const slugToDisplayName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to convert display name to slug
const displayNameToSlug = (name: string): string => {
  return name.toLowerCase().replace(/['\s]+/g, '-');
};

// Type for merchant with categories
interface MerchantWithCategories {
  id: number;
  restaurant_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  website?: string | null;
  logo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  slug?: string | null;
  neighborhood?: string | null;
  merchant_categories?: Array<{
    categories: {
      id: string;
      name: string;
      slug: string;
    } | null;
  }>;
}

const generateLocationStructuredData = (city: string, state: string, neighborhood?: string) => {
  const locationName = neighborhood ? `${neighborhood}, ${city}, ${state}` : `${city}, ${state}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `Happy Hour in ${locationName}`,
    "description": `Discover the best happy hour deals and specials in ${locationName}. Find restaurants and bars with great food, drinks, and atmosphere.`,
    "url": `https://sipmunchyap.com/happy-hour/${displayNameToSlug(city)}-${state.toLowerCase()}${neighborhood ? '/' + displayNameToSlug(neighborhood) : ''}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://sipmunchyap.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": `Happy Hour ${city}, ${state}`,
          "item": `https://sipmunchyap.com/happy-hour/${displayNameToSlug(city)}-${state.toLowerCase()}`
        },
        ...(neighborhood ? [{
          "@type": "ListItem",
          "position": 3,
          "name": neighborhood,
          "item": `https://sipmunchyap.com/happy-hour/${displayNameToSlug(city)}-${state.toLowerCase()}/${displayNameToSlug(neighborhood)}`
        }] : [])
      ]
    }
  };
};

// Generate ItemList schema for restaurant listings (limited to 20)
const generateRestaurantListSchema = (
  merchants: MerchantWithCategories[],
  city: string,
  state: string,
  neighborhood?: string
) => {
  const limitedMerchants = merchants.slice(0, 20);
  const locationName = neighborhood ? `${neighborhood}, ${city}` : `${city}, ${state}`;
  
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Happy Hour Restaurants in ${locationName}`,
    "description": `List of ${limitedMerchants.length} restaurants and bars with happy hour deals in ${locationName}`,
    "numberOfItems": limitedMerchants.length,
    "itemListElement": limitedMerchants.map((merchant, index) => {
      const cuisineTypes = merchant.merchant_categories
        ?.map(mc => mc.categories?.name)
        .filter((name): name is string => !!name) || [];

      const restaurantSchema: Record<string, unknown> = {
        "@type": "Restaurant",
        "@id": `https://sipmunchyap.com/restaurant/${merchant.slug || merchant.id}`,
        "name": merchant.restaurant_name,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": merchant.street_address,
          "addressLocality": merchant.city,
          "addressRegion": merchant.state,
          "postalCode": merchant.zip_code,
          "addressCountry": "US"
        }
      };

      if (merchant.phone_number) restaurantSchema.telephone = merchant.phone_number;
      if (merchant.website) restaurantSchema.url = merchant.website;
      if (merchant.logo_url) restaurantSchema.image = merchant.logo_url;
      if (merchant.latitude && merchant.longitude) {
        restaurantSchema.geo = {
          "@type": "GeoCoordinates",
          "latitude": merchant.latitude,
          "longitude": merchant.longitude
        };
      }
      if (cuisineTypes.length > 0) restaurantSchema.servesCuisine = cuisineTypes;

      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": restaurantSchema
      };
    })
  };
};

export const LocationLanding = () => {
  const { citySlug, neighborhoodSlug } = useParams<{ citySlug: string; neighborhoodSlug?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { track } = useAnalytics();
  
  // Scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [citySlug, neighborhoodSlug]);
  
  // Parse city and state from slug (e.g., "new-york-ny" -> "New York", "NY")
  const cityParts = citySlug?.split('-') || [];
  const state = cityParts.pop()?.toUpperCase() || 'NY';
  const city = slugToDisplayName(cityParts.join('-'));
  const neighborhood = neighborhoodSlug ? slugToDisplayName(neighborhoodSlug) : undefined;

  // Construct location string for API call
  const locationString = neighborhood 
    ? `${neighborhood}, ${city}, ${state}`
    : `${city}, ${state}`;

  // ── Filter state from URL params (mirrors Results.tsx) ──
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const showOffersOnly = searchParams.get('offers') === 'true';
  const selectedMenuType = (searchParams.get('menuType') as 'all' | 'food_and_drinks' | 'drinks_only') || 'all';
  const explicitRadius = searchParams.get('radius') as RadiusOption | null;
  const locationTypeForRadius = neighborhood ? 'neighborhood' : 'city';
  const selectedRadius: RadiusOption = explicitRadius || getSmartDefaultRadius(locationTypeForRadius, false);
  const happeningNow = searchParams.get('happeningNow') === 'true';
  const happeningToday = searchParams.get('happeningToday') === 'true';
  const sortBy = searchParams.get('sortBy') || 'default';
  // Pre-select neighborhood from URL slug or search param
  const selectedNeighborhood = neighborhood || searchParams.get('neighborhood') || null;

  const selectedDays = (() => {
    const daysParam = searchParams.get('days');
    return daysParam ? daysParam.split(',').map(Number) : [];
  })();
  const startTime = searchParams.get('startTime') || '';
  const endTime = searchParams.get('endTime') || '';

  // ── URL param setters ──
  const setSelectedCategories = (categories: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (categories.length > 0) newParams.set('categories', categories.join(','));
    else newParams.delete('categories');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setSelectedRadius = (radius: RadiusOption) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('radius', radius);
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setShowOffersOnly = (show: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (show) newParams.set('offers', 'true');
    else newParams.delete('offers');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setSelectedMenuType = (menuType: 'all' | 'food_and_drinks' | 'drinks_only') => {
    const newParams = new URLSearchParams(searchParams);
    if (menuType !== 'all') newParams.set('menuType', menuType);
    else newParams.delete('menuType');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setHappeningNow = (value: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('happeningNow', 'true');
      newParams.delete('happeningToday');
      newParams.delete('days');
      newParams.delete('startTime');
      newParams.delete('endTime');
    } else {
      newParams.delete('happeningNow');
    }
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setHappeningToday = (value: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('happeningToday', 'true');
      newParams.delete('happeningNow');
      newParams.delete('days');
      newParams.delete('startTime');
      newParams.delete('endTime');
    } else {
      newParams.delete('happeningToday');
    }
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const handleDaysChange = (days: number[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (happeningNow) newParams.delete('happeningNow');
    if (happeningToday) newParams.delete('happeningToday');
    if (days.length > 0) newParams.set('days', days.join(','));
    else newParams.delete('days');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const handleStartTimeChange = (time: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (happeningNow) newParams.delete('happeningNow');
    if (happeningToday) newParams.delete('happeningToday');
    if (time) newParams.set('startTime', time);
    else newParams.delete('startTime');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const handleEndTimeChange = (time: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (happeningNow) newParams.delete('happeningNow');
    if (happeningToday) newParams.delete('happeningToday');
    if (time) newParams.set('endTime', time);
    else newParams.delete('endTime');
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  };

  const setSortBy = useCallback((value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'default') newParams.delete('sortBy');
    else newParams.set('sortBy', value);
    newParams.delete('page');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleClearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    const filterKeys = ['categories', 'radius', 'offers', 'days', 'startTime', 'endTime', 'menuType', 'happeningNow', 'happeningToday', 'page', 'sortBy', 'neighborhood'];
    filterKeys.forEach(key => newParams.delete(key));
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const setSelectedNeighborhood = (value: string | null) => {
    track({
      eventType: 'click',
      eventCategory: 'location_landing',
      eventAction: value ? 'neighborhood_filter_selected' : 'neighborhood_filter_cleared',
      eventLabel: value || 'all',
      locationQuery: locationString,
    });

    if (value) {
      // Navigate to the neighborhood URL (e.g. /happy-hour/new-york-ny/williamsburg)
      navigate(`/happy-hour/${citySlug}/${displayNameToSlug(value)}`);
    } else {
      // Navigate back to the city page (e.g. /happy-hour/new-york-ny)
      navigate(`/happy-hour/${citySlug}`);
    }
  };

  // ── Effective time/day computations ──
  const effectiveDays = (() => {
    if (!happeningNow && !happeningToday) return selectedDays;
    const jsDay = new Date().getDay();
    return [jsDay === 0 ? 6 : jsDay - 1];
  })();

  const effectiveStartTime = happeningNow
    ? new Date().toTimeString().slice(0, 5)
    : happeningToday ? '' : startTime;
  const effectiveEndTime = happeningNow
    ? new Date().toTimeString().slice(0, 5)
    : happeningToday ? '' : endTime;

  // ── Map state ──
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<number | null>(null);
  const [mapViewState, setMapViewState] = useState({
    longitude: -73.9712,
    latitude: 40.7831,
    zoom: 12
  });
  const [showSearchThisAreaDesktop, setShowSearchThisAreaDesktop] = useState(false);
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [searchedBounds, setSearchedBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [isUsingMapSearch, setIsUsingMapSearch] = useState(false);

  // Mobile-only state
  const [view, setView] = useState<'list' | 'map'>('list');
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [showSearchThisAreaMobile, setShowSearchThisAreaMobile] = useState(false);

  const radiusMiles = getRadiusMiles(selectedRadius);

  // Fetch unfiltered merchants first to build neighborhood centers and options (only for city pages)
  const { data: allMerchants } = useMerchants(
    undefined, undefined, undefined, undefined,
    locationString,
    undefined,
    50, // large radius
    undefined, undefined, undefined, undefined,
    undefined, // no neighborhood filter
    'all'
  );

  // Compute neighborhood centers by averaging lat/lng of merchants tagged with each neighborhood
  const neighborhoodCenters = useMemo(() => {
    if (!allMerchants?.length) return {};
    const acc: Record<string, { sumLat: number; sumLng: number; count: number }> = {};
    allMerchants.forEach(m => {
      if (m.neighborhood && m.latitude && m.longitude) {
        if (!acc[m.neighborhood]) acc[m.neighborhood] = { sumLat: 0, sumLng: 0, count: 0 };
        acc[m.neighborhood].sumLat += Number(m.latitude);
        acc[m.neighborhood].sumLng += Number(m.longitude);
        acc[m.neighborhood].count += 1;
      }
    });
    const centers: Record<string, { lat: number; lng: number }> = {};
    for (const [name, data] of Object.entries(acc)) {
      centers[name] = { lat: data.sumLat / data.count, lng: data.sumLng / data.count };
    }
    return centers;
  }, [allMerchants]);

  // ── Data fetching ──
  // When a neighborhood is selected from the dropdown, use geo-radius filtering
  // instead of DB column matching for better results
  const neighborhoodCenter = selectedNeighborhood ? neighborhoodCenters[selectedNeighborhood] : undefined;
  const useGeoNeighborhood = !!neighborhoodCenter; // geo-radius for both URL slug and dropdown selection

  const { data: rawMerchants, isLoading, isFetched } = useMerchants(
    selectedCategories.length > 0 ? selectedCategories : undefined,
    undefined, // searchTerm
    effectiveStartTime || undefined,
    effectiveEndTime || undefined,
    isUsingMapSearch ? undefined : (useGeoNeighborhood ? undefined : locationString),
    isUsingMapSearch ? searchedBounds : undefined,
    isUsingMapSearch ? undefined : radiusMiles,
    showOffersOnly || undefined,
    effectiveDays.length > 0 ? effectiveDays : undefined,
    useGeoNeighborhood ? neighborhoodCenter : undefined, // gpsCoordinates from neighborhood center
    undefined, // carouselId
    useGeoNeighborhood ? undefined : (neighborhood || undefined), // use geo when available, DB filter as fallback
    selectedMenuType
  );

  // Sort merchants
  const merchants = React.useMemo(() => {
    if (!rawMerchants || sortBy === 'default') return rawMerchants;
    const sorted = [...rawMerchants];

    const getEffectiveRating = (m: any): number => {
      const reviews = m.merchant_reviews?.filter((r: any) => r.status === 'published') || [];
      if (reviews.length > 0) {
        let sum = 0, count = 0;
        reviews.forEach((review: any) => {
          review.merchant_review_ratings?.forEach((r: { rating: number }) => { sum += r.rating; count++; });
        });
        if (count > 0) return sum / count;
      }
      const google = m.merchant_google_ratings;
      if (google && google.match_confidence !== 'no_match' && google.google_rating) return google.google_rating;
      return 0;
    };

    const getEffectiveReviewCount = (m: any): number => {
      const reviews = m.merchant_reviews?.filter((r: any) => r.status === 'published') || [];
      if (reviews.length > 0) return reviews.length;
      const google = m.merchant_google_ratings;
      if (google && google.match_confidence !== 'no_match' && google.google_review_count) return google.google_review_count;
      return 0;
    };

    if (sortBy === 'highest_rated') sorted.sort((a, b) => getEffectiveRating(b) - getEffectiveRating(a));
    else if (sortBy === 'most_reviewed') sorted.sort((a, b) => getEffectiveReviewCount(b) - getEffectiveReviewCount(a));
    return sorted;
  }, [rawMerchants, sortBy]);

  // Get unique neighborhoods with counts from unfiltered data
  const neighborhoodOptions = useMemo(() => {
    if (!allMerchants?.length) return [];
    const counts = new Map<string, number>();
    allMerchants.forEach(m => {
      if (m.neighborhood) {
        counts.set(m.neighborhood, (counts.get(m.neighborhood) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMerchants, neighborhood]);


  // Determine if this is an invalid location (404 case)
  const isInvalidLocation = useMemo(() => {
    if (!isFetched || isLoading) return false;
    if (neighborhoodSlug && (!rawMerchants || rawMerchants.length === 0)) return true;
    return false;
  }, [isFetched, isLoading, neighborhoodSlug, rawMerchants]);

  // ── Map handlers ──
  const handleMapMove = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setMapBounds(bounds);
    if (isUsingMapSearch && searchedBounds) {
      const boundsChanged =
        bounds.north !== searchedBounds.north || bounds.south !== searchedBounds.south ||
        bounds.east !== searchedBounds.east || bounds.west !== searchedBounds.west;
      if (boundsChanged) {
        setShowSearchThisAreaDesktop(true);
        setShowSearchThisAreaMobile(true);
      }
    } else if (!hasMapMoved) {
      setHasMapMoved(true);
      setShowSearchThisAreaDesktop(true);
      setShowSearchThisAreaMobile(true);
    }
  }, [isUsingMapSearch, searchedBounds, hasMapMoved]);

  const handleSearchThisArea = useCallback(async () => {
    await track({
      eventType: 'click',
      eventCategory: 'map_interaction',
      eventAction: 'search_area_clicked',
      metadata: { mapBounds, previousResultsCount: merchants?.length || 0 },
    });
    setSearchedBounds(mapBounds);
    setIsUsingMapSearch(true);
    setShowSearchThisAreaDesktop(false);
    setShowSearchThisAreaMobile(false);
  }, [mapBounds, merchants?.length, track]);

  const handleViewStateChange = useCallback((newViewState: { longitude: number; latitude: number; zoom: number }) => {
    setMapViewState(newViewState);
  }, []);

  // ── SEO ──
  const structuredData = useMemo(() => {
    const pageSchema = generateLocationStructuredData(city, state, neighborhood);
    if (merchants && merchants.length > 0) {
      const itemListSchema = generateRestaurantListSchema(merchants, city, state, neighborhood);
      return [pageSchema, itemListSchema];
    }
    return pageSchema;
  }, [city, state, neighborhood, merchants]);

  const pageTitle = neighborhood
    ? `Happy Hour in ${neighborhood}, ${city} | SipMunchYap`
    : `Happy Hour in ${city}, ${state} | SipMunchYap`;

  const pageDescription = neighborhood
    ? `Find the best happy hour deals in ${neighborhood}, ${city}. Discover restaurants and bars with amazing food, drinks, and specials in ${neighborhood}.`
    : `Explore happy hour deals across ${city}, ${state}. Browse by neighborhood to find the perfect spot for after-work drinks and appetizers.`;

  const keywords = neighborhood
    ? `happy hour ${neighborhood}, ${neighborhood} bars, ${neighborhood} restaurants, happy hour deals ${city}, ${neighborhood} ${city}`
    : `happy hour ${city}, ${city} bars, ${city} restaurants, happy hour ${state}, best happy hours ${city}`;

  if (isInvalidLocation) return <NotFound />;

  // ── Render ──
  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={keywords}
        canonical={`https://sipmunchyap.com/happy-hour/${citySlug}${neighborhoodSlug ? '/' + neighborhoodSlug : ''}`}
        structuredData={structuredData}
        noIndex={isInvalidLocation}
      />

      <div className="min-h-screen bg-muted/30">
        {!isMobile && <PageHeader showSearchBar={true} searchBarVariant="results" />}

        {/* ── Mobile Layout (matches /results mobile pattern) ── */}
        {isMobile && (
          <>
            {/* Fixed compact header */}
            <div className="bg-background shadow-sm border-b border-border fixed top-0 left-0 right-0 z-50 h-16">
              <div className="px-4 py-2 flex items-center h-full gap-2">
                <Link
                  to={neighborhood ? `/happy-hour/${citySlug}` : '/'}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {neighborhood ? `${neighborhood}, ${city}` : `${city}, ${state}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {merchants?.length || 0} happy hour spots
                  </p>
                </div>
              </div>
            </div>

            {/* Full-screen map */}
            <div className="fixed inset-0 pt-16 overflow-hidden">
              <div className="h-full w-full overflow-hidden">
                <LazyResultsMap
                  restaurants={merchants || []}
                  onMapMove={handleMapMove}
                  showSearchThisArea={false}
                  onSearchThisArea={handleSearchThisArea}
                  isUsingMapSearch={isUsingMapSearch}
                  viewState={mapViewState}
                  onViewStateChange={handleViewStateChange}
                  isMobile={true}
                  hoveredRestaurantId={hoveredRestaurantId}
                  searchLocation={locationString}
                  isLoading={isLoading}
                />
              </div>

              {/* Search this area button */}
              {showSearchThisAreaMobile && !isListDrawerOpen && (
                <div className="fixed top-20 left-4 right-4 z-50">
                  <button
                    onClick={handleSearchThisArea}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium shadow-lg transition-colors duration-200"
                  >
                    Search this area
                  </button>
                </div>
              )}

              {/* Swipeable peek handle */}
              <div
                className="fixed bottom-16 left-0 right-0 bg-background rounded-t-2xl shadow-2xl z-50"
                style={{ height: 'calc(100vh / 8)' }}
                onTouchStart={(e) => {
                  const startY = e.touches[0].clientY;
                  const handleTouchMove = (moveE: TouchEvent) => {
                    const currentY = moveE.touches[0].clientY;
                    const deltaY = startY - currentY;
                    if (deltaY > 50) {
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
                  <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>
                <div className="px-4 pt-2">
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Searching...
                      </span>
                    ) : (
                      <>{merchants?.length || 0} results • Swipe up for list</>
                    )}
                  </p>
                </div>
              </div>

              {/* List drawer */}
              <MobileListDrawer
                isOpen={isListDrawerOpen}
                onOpenChange={setIsListDrawerOpen}
                merchants={merchants || []}
                isLoading={isLoading}
                error={null}
                startTime={effectiveStartTime}
                endTime={effectiveEndTime}
                location={locationString}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                selectedRadius={selectedRadius}
                onRadiusChange={setSelectedRadius}
                isRadiusEnabled={true}
                showOffersOnly={showOffersOnly}
                onShowOffersChange={setShowOffersOnly}
                selectedDays={selectedDays}
                onDaysChange={handleDaysChange}
                onStartTimeChange={handleStartTimeChange}
                onEndTimeChange={handleEndTimeChange}
                selectedMenuType={selectedMenuType}
                onMenuTypeChange={setSelectedMenuType}
                happeningNow={happeningNow}
                onHappeningNowChange={setHappeningNow}
                happeningToday={happeningToday}
                onHappeningTodayChange={setHappeningToday}
                locationType={locationTypeForRadius}
                onClearAllFilters={handleClearAllFilters}
                sortBy={sortBy}
                onSortChange={setSortBy}
                neighborhoods={!neighborhood ? neighborhoodOptions : undefined}
                selectedNeighborhood={selectedNeighborhood}
                onNeighborhoodChange={setSelectedNeighborhood}
              />
            </div>
          </>
        )}

        {/* ── Desktop Layout (3-column, mirrors /results) ── */}
        {!isMobile && (
          <div className="pt-40 px-4 py-6">
            {/* Compact breadcrumb + title */}
            <div className="max-w-[120rem] mx-auto mb-6">
              <nav className="mb-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link to={`/happy-hour/${citySlug}`} className="hover:text-foreground transition-colors">
                  Happy Hour {city}, {state}
                </Link>
                {neighborhood && (
                  <>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{neighborhood}</span>
                  </>
                )}
              </nav>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">
                  Happy Hour in {neighborhood ? `${neighborhood}, ${city}` : `${city}, ${state}`}
                </h1>
              </div>
            </div>

            {/* Tablet Layout (768px - 1280px) */}
            <div className="xl:hidden max-w-7xl mx-auto space-y-6">
              <div className="bg-card rounded-lg shadow-sm p-3">
                <UnifiedFilterBar
                  selectedCategories={selectedCategories}
                  onCategoryChange={setSelectedCategories}
                  selectedRadius={selectedRadius}
                  onRadiusChange={setSelectedRadius}
                  isRadiusEnabled={true}
                  showOffersOnly={showOffersOnly}
                  onShowOffersChange={setShowOffersOnly}
                  selectedDays={selectedDays}
                  onDaysChange={handleDaysChange}
                  startTime={startTime}
                  endTime={endTime}
                  onStartTimeChange={handleStartTimeChange}
                  onEndTimeChange={handleEndTimeChange}
                  selectedMenuType={selectedMenuType}
                  onMenuTypeChange={setSelectedMenuType}
                  happeningNow={happeningNow}
                  onHappeningNowChange={setHappeningNow}
                  happeningToday={happeningToday}
                  onHappeningTodayChange={setHappeningToday}
                    locationType={locationTypeForRadius}
                    onClearAllFilters={handleClearAllFilters}
                    neighborhoods={neighborhoodOptions}
                    selectedNeighborhood={selectedNeighborhood}
                    onNeighborhoodChange={setSelectedNeighborhood}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                  <SearchResults
                    merchants={merchants}
                    isLoading={isLoading}
                    error={null}
                    startTime={effectiveStartTime}
                    endTime={effectiveEndTime}
                    location={locationString}
                    onRestaurantHover={setHoveredRestaurantId}
                    happeningNow={happeningNow}
                    happeningToday={happeningToday}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
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
                      searchLocation={locationString}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout (>1280px) - 3 columns */}
            <div className="hidden xl:flex xl:gap-6 max-w-[120rem] mx-auto">
              {/* Left: Sticky filter sidebar */}
              <div className="w-80 flex-shrink-0">
                <div className="sticky top-32 z-40 max-h-[calc(100vh-9rem)] overflow-y-auto">
                  <UnifiedFilterBar
                    selectedCategories={selectedCategories}
                    onCategoryChange={setSelectedCategories}
                    selectedRadius={selectedRadius}
                    onRadiusChange={setSelectedRadius}
                    isRadiusEnabled={true}
                    showOffersOnly={showOffersOnly}
                    onShowOffersChange={setShowOffersOnly}
                    selectedDays={selectedDays}
                    onDaysChange={handleDaysChange}
                    startTime={startTime}
                    endTime={endTime}
                    onStartTimeChange={handleStartTimeChange}
                    onEndTimeChange={handleEndTimeChange}
                    selectedMenuType={selectedMenuType}
                    onMenuTypeChange={setSelectedMenuType}
                    happeningNow={happeningNow}
                    onHappeningNowChange={setHappeningNow}
                    happeningToday={happeningToday}
                    onHappeningTodayChange={setHappeningToday}
                    locationType={locationTypeForRadius}
                    onClearAllFilters={handleClearAllFilters}
                    neighborhoods={neighborhoodOptions}
                    selectedNeighborhood={selectedNeighborhood}
                    onNeighborhoodChange={setSelectedNeighborhood}
                  />
                </div>
              </div>

              {/* Center: Results */}
              <div className="flex-1 min-w-[28rem]">
                <SearchResults
                  merchants={merchants}
                  isLoading={isLoading}
                  error={null}
                  startTime={effectiveStartTime}
                  endTime={effectiveEndTime}
                  location={locationString}
                  onRestaurantHover={setHoveredRestaurantId}
                  happeningNow={happeningNow}
                  happeningToday={happeningToday}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>

              {/* Right: Sticky map */}
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
                    searchLocation={locationString}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* SEO content */}
            <div className="max-w-[120rem] mx-auto mt-12">
              <section className="prose prose-sm max-w-none">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  About Happy Hour in {neighborhood || city}
                </h2>
                <p className="text-muted-foreground">
                  {neighborhood
                    ? `${neighborhood} is known for its vibrant dining and nightlife scene. Whether you're looking for craft cocktails, local brews, or delicious appetizers, ${neighborhood} offers a diverse selection of happy hour venues.`
                    : `${city} is home to some of the best happy hours in ${state}. From rooftop bars to cozy neighborhood pubs, the city offers endless options for enjoying discounted drinks and food.`
                  }
                </p>
              </section>
            </div>

            <Footer />
          </div>
        )}
      </div>
    </>
  );
};

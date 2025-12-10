import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMemo, useState, useLayoutEffect } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useMerchants } from '@/hooks/useMerchants';
import { SearchResultCard } from '@/components/SearchResultCard';
import { SearchResultsLoading } from '@/components/SearchResultsLoading';
import { SearchResultsEmpty } from '@/components/SearchResultsEmpty';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Utensils } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { ViewToggle } from '@/components/ViewToggle';
import { LazyResultsMap } from '@/components/LazyResultsMap';
import { useAnalytics } from '@/hooks/useAnalytics';
import NotFound from '@/pages/NotFound';
import { PageHeader } from '@/components/PageHeader';

// Location landing page with analytics tracking

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
      // Extract cuisine types from categories
      const cuisineTypes = merchant.merchant_categories
        ?.map(mc => mc.categories?.name)
        .filter((name): name is string => !!name) || [];

      // Build restaurant schema with only available data
      const restaurantSchema: Record<string, unknown> = {
        "@type": "Restaurant",
        "@id": merchant.slug 
          ? `https://sipmunchyap.com/restaurant/${merchant.slug}` 
          : `https://sipmunchyap.com/restaurant/${merchant.id}`,
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

      // Add optional fields only if they exist
      if (merchant.phone_number) {
        restaurantSchema.telephone = merchant.phone_number;
      }
      if (merchant.website) {
        restaurantSchema.url = merchant.website;
      }
      if (merchant.logo_url) {
        restaurantSchema.image = merchant.logo_url;
      }
      if (merchant.latitude && merchant.longitude) {
        restaurantSchema.geo = {
          "@type": "GeoCoordinates",
          "latitude": merchant.latitude,
          "longitude": merchant.longitude
        };
      }
      if (cuisineTypes.length > 0) {
        restaurantSchema.servesCuisine = cuisineTypes;
      }

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
  const isMobile = useIsMobile();
  const { track } = useAnalytics();
  
  // Scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [citySlug, neighborhoodSlug]);
  
  // View state for desktop only
  const [view, setView] = useState<'list' | 'map'>('list');
  const [hoveredRestaurantId, setHoveredRestaurantId] = useState<number | null>(null);
  const [mapViewState, setMapViewState] = useState({
    longitude: -73.9712,
    latitude: 40.7831,
    zoom: 12
  });
  
  // Parse city and state from slug (e.g., "new-york-ny" -> "New York", "NY")
  const cityParts = citySlug?.split('-') || [];
  const state = cityParts.pop()?.toUpperCase() || 'NY';
  const city = slugToDisplayName(cityParts.join('-'));
  const neighborhood = neighborhoodSlug ? slugToDisplayName(neighborhoodSlug) : undefined;

  // Construct location string for API call
  const locationString = neighborhood 
    ? `${neighborhood}, ${city}, ${state}`
    : `${city}, ${state}`;

  const { data: merchants, isLoading, isFetched } = useMerchants(
    undefined, // categoryIds
    undefined, // searchTerm
    undefined, // startTime
    undefined, // endTime
    locationString, // location
    undefined, // bounds
    50, // radiusMiles - large radius to get all merchants in the area
    undefined, // showOffersOnly
    undefined, // selectedDays
    undefined, // gpsCoordinates
    undefined, // carouselId
    neighborhood // neighborhood - filter by exact neighborhood if provided
  );

  // Determine if this is an invalid location (404 case)
  // For neighborhood pages: if data loaded but no merchants found AND this is a specific neighborhood
  const isInvalidLocation = useMemo(() => {
    if (!isFetched || isLoading) return false;
    // If it's a neighborhood page with no results, it's likely an invalid combination
    if (neighborhoodSlug && (!merchants || merchants.length === 0)) {
      return true;
    }
    return false;
  }, [isFetched, isLoading, neighborhoodSlug, merchants]);

  // Generate combined structured data (WebPage + ItemList)
  const structuredData = useMemo(() => {
    const pageSchema = generateLocationStructuredData(city, state, neighborhood);
    
    // Only add ItemList if we have merchants
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

  // Get unique neighborhoods from merchants for city page
  const neighborhoods = useMemo(() => {
    if (neighborhood || !merchants?.length) return [];
    
    const uniqueNeighborhoods = new Set<string>();
    merchants.forEach(merchant => {
      if (merchant.neighborhood) {
        uniqueNeighborhoods.add(merchant.neighborhood);
      }
    });
    
    return Array.from(uniqueNeighborhoods).sort();
  }, [merchants, neighborhood]);

  // Map handlers for desktop
  const handleMapMove = (bounds: { north: number; south: number; east: number; west: number }) => {
    // We don't filter by bounds on location pages, just track the movement
  };

  const handleViewStateChange = (viewState: { longitude: number; latitude: number; zoom: number }) => {
    setMapViewState(viewState);
  };

  // Return 404 for invalid city/neighborhood combinations
  // This tells search engines this page doesn't exist
  if (isInvalidLocation) {
    return <NotFound />;
  }

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
      
      <div className="min-h-screen relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          {!isMobile && <PageHeader showSearchBar={true} searchBarVariant="results" />}
        {/* Hero Section */}
        <section className={`bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4 ${!isMobile ? 'pt-40' : ''}`}>
          <div className="container mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
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

            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Happy Hour in {neighborhood ? `${neighborhood}, ${city}` : `${city}, ${state}`}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
              {neighborhood 
                ? `Discover the best happy hour spots in ${neighborhood}. Find amazing deals on drinks and food at local bars and restaurants.`
                : `Browse happy hour deals across ${city}. Select a neighborhood below or explore all locations.`
              }
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <span className="font-semibold">{merchants?.length || 0} Restaurants & Bars</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold">Daily Happy Hour Deals</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-semibold">{neighborhood || `${neighborhoods.length} Neighborhoods`}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-4 py-4">
          {/* Neighborhoods Grid (City page only) */}
          {!neighborhood && neighborhoods.length > 0 && (
            <section className="mb-6">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Browse by Neighborhood</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {neighborhoods.map((hood) => (
                  <Link
                    key={hood}
                    to={`/happy-hour/${citySlug}/${displayNameToSlug(hood)}`}
                    className="p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                    onClick={() => {
                      track({
                        eventType: 'click',
                        eventCategory: 'location_landing',
                        eventAction: 'neighborhood_click',
                        eventLabel: hood,
                        locationQuery: locationString,
                        metadata: {
                          neighborhood: hood,
                          merchant_count: merchants.filter(m => m.neighborhood === hood).length
                        }
                      });
                    }}
                  >
                    <MapPin className="h-5 w-5 text-primary mb-2" />
                    <h3 className="font-semibold text-foreground">{hood}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {merchants.filter(m => m.neighborhood === hood).length} spots
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Results Section */}
          <section>
            <div className="flex justify-end items-center mb-4">
              <div className="flex items-center gap-4">
                {/* Mobile View Toggle - only on neighborhood pages */}
                {isMobile && neighborhood && (
                  <ViewToggle 
                    view={view} 
                    onViewChange={(newView) => {
                      setView(newView);
                      track({
                        eventType: 'click',
                        eventCategory: 'location_landing',
                        eventAction: 'view_toggle',
                        eventLabel: newView,
                        locationQuery: locationString,
                        metadata: { view: newView, device: 'mobile' }
                      });
                    }} 
                  />
                )}
                {/* Desktop View Toggle */}
                {!isMobile && (
                  <ViewToggle 
                    view={view} 
                    onViewChange={(newView) => {
                      setView(newView);
                      track({
                        eventType: 'click',
                        eventCategory: 'location_landing',
                        eventAction: 'view_toggle',
                        eventLabel: newView,
                        locationQuery: locationString,
                        metadata: { view: newView, device: 'desktop' }
                      });
                    }} 
                  />
                )}
                {/* View All button for mobile on neighborhood pages */}
                {isMobile && neighborhood && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/happy-hour/${citySlug}`}>
                      View All {city}
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <SearchResultsLoading />
            ) : merchants && merchants.length > 0 ? (
              <>
                {/* List View */}
                {view === 'list' && (
                  <div className="grid gap-4">
                    {merchants.map((merchant) => (
                      <SearchResultCard
                        key={merchant.id}
                        restaurant={merchant}
                        onClick={(id) => navigate(`/restaurant/${id}`)}
                        isMobile={isMobile}
                        onHover={!isMobile ? setHoveredRestaurantId : undefined}
                      />
                    ))}
                  </div>
                )}

                {/* Map View - Mobile (neighborhood only) and Desktop */}
                {view === 'map' && (isMobile ? neighborhood : true) && (
                  <div className="min-h-[600px]">
                    <LazyResultsMap 
                      restaurants={merchants || []}
                      onMapMove={handleMapMove}
                      showSearchThisArea={false}
                      isUsingMapSearch={false}
                      viewState={mapViewState}
                      onViewStateChange={handleViewStateChange}
                      isMobile={false}
                      hoveredRestaurantId={hoveredRestaurantId}
                      searchLocation={locationString}
                    />
                  </div>
                )}
              </>
            ) : (
              <SearchResultsEmpty 
                location={locationString}
              />
            )}
          </section>

          {/* SEO Content */}
          <section className="mt-12 prose prose-sm max-w-none">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              About Happy Hour in {neighborhood || city}
            </h2>
            <p className="text-muted-foreground">
              {neighborhood 
                ? `${neighborhood} is known for its vibrant dining and nightlife scene. Whether you're looking for craft cocktails, local brews, or delicious appetizers, ${neighborhood} offers a diverse selection of happy hour venues. Browse our listings to find the perfect spot for after-work drinks or a casual evening out.`
                : `${city} is home to some of the best happy hours in ${state}. From rooftop bars to cozy neighborhood pubs, the city offers endless options for enjoying discounted drinks and food. Use our neighborhood guides to discover hidden gems and popular spots in your area.`
              }
            </p>
          </section>
        </div>
        <Footer />
        </div>
      </div>
    </>
  );
};

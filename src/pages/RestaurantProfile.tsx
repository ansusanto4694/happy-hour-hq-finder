
import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantHeader } from '@/components/RestaurantHeader';
import { PageHeader } from '@/components/PageHeader';
import { RestaurantProfileContent } from '@/components/RestaurantProfileContent';
import { SEOHead } from '@/components/SEOHead';
import { trackFunnelStep } from '@/utils/analytics';
import { Footer } from '@/components/Footer';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileCTABar } from '@/components/MobileCTABar';

// Restaurant profile page with enhanced analytics tracking

const generateRestaurantStructuredData = (restaurant: any) => {
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Happy Hour opening hours as special hours
  const happyHourSpecifications = restaurant.merchant_happy_hour?.map((hh: any) => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": dayMap[hh.day_of_week],
    "opens": hh.happy_hour_start,
    "closes": hh.happy_hour_end,
    "validFrom": new Date().toISOString().split('T')[0],
    "name": "Happy Hour"
  })) || [];

  const cuisineTypes = restaurant.merchant_categories
    ?.map((mc: any) => mc.categories?.name)
    .filter(Boolean) || [];

  const address = {
    "@type": "PostalAddress",
    "streetAddress": [restaurant.street_address, restaurant.street_address_line_2]
      .filter(Boolean)
      .join(', '),
    "addressLocality": restaurant.city,
    "addressRegion": restaurant.state,
    "postalCode": restaurant.zip_code,
    "addressCountry": "US"
  };

  const geo = restaurant.latitude && restaurant.longitude ? {
    "@type": "GeoCoordinates",
    "latitude": restaurant.latitude.toString(),
    "longitude": restaurant.longitude.toString()
  } : undefined;

  // Create offers for happy hour time slots
  const happyHourOffers = restaurant.merchant_happy_hour?.map((hh: any) => ({
    "@type": "Offer",
    "name": "Happy Hour Special",
    "description": `Happy hour from ${hh.happy_hour_start} to ${hh.happy_hour_end} on ${dayMap[hh.day_of_week]}`,
    "availabilityStarts": hh.happy_hour_start,
    "availabilityEnds": hh.happy_hour_end,
    "dayOfWeek": dayMap[hh.day_of_week],
    "priceSpecification": {
      "@type": "PriceSpecification",
      "priceCurrency": "USD"
    }
  })) || [];

  // Add specific happy hour deal offers
  const dealOffers = restaurant.happy_hour_deals?.filter((deal: any) => deal.active).map((deal: any) => ({
    "@type": "Offer",
    "name": deal.deal_title,
    "description": deal.deal_description || deal.deal_title,
    "category": "Happy Hour Deal",
    "priceCurrency": "USD"
  })) || [];

  // Combine all offers
  const allOffers = [...happyHourOffers, ...dealOffers];

  // Use slug for canonical URLs, fallback to ID
  const restaurantUrl = restaurant.slug 
    ? `https://sipmunchyap.com/restaurant/${restaurant.slug}`
    : `https://sipmunchyap.com/restaurant/${restaurant.id}`;

  // Base Restaurant & LocalBusiness schema
  const baseSchema: any = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness", "BarOrPub"],
    "@id": restaurantUrl,
    "name": restaurant.restaurant_name,
    "description": `${restaurant.restaurant_name} in ${restaurant.city}, ${restaurant.state}. Find happy hour specials, deals, and drink offers.`,
    "address": address,
    "geo": geo,
    "url": restaurantUrl,
    "image": restaurant.logo_url || "https://lovable.dev/opengraph-image-p98pqg.png",
    "priceRange": "$$",
    "servesCuisine": cuisineTypes.length > 0 ? cuisineTypes : ["American"],
    "acceptsReservations": true
  };

  // Add telephone if available
  if (restaurant.phone_number) {
    baseSchema.telephone = restaurant.phone_number;
  }

  // Add website if available
  if (restaurant.website) {
    baseSchema.sameAs = [restaurant.website];
  }

  // Add happy hour specifications as special hours
  if (happyHourSpecifications.length > 0) {
    baseSchema.specialOpeningHoursSpecification = happyHourSpecifications;
  }

  // Add offers if available
  if (allOffers.length > 0) {
    baseSchema.makesOffer = allOffers;
  }

  // Add neighborhood to additional properties
  if (restaurant.neighborhood) {
    baseSchema.containedInPlace = {
      "@type": "Place",
      "name": restaurant.neighborhood,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": restaurant.city,
        "addressRegion": restaurant.state,
        "addressCountry": "US"
      }
    };
  }

  return baseSchema;
};

const generateBreadcrumbStructuredData = (restaurant: any) => {
  return {
    "@context": "https://schema.org",
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
        "name": `Happy Hours in ${restaurant.city}, ${restaurant.state}`,
        "item": `https://sipmunchyap.com/results?location=${encodeURIComponent(restaurant.city + ', ' + restaurant.state)}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": restaurant.restaurant_name,
        "item": restaurant.slug 
          ? `https://sipmunchyap.com/restaurant/${restaurant.slug}`
          : `https://sipmunchyap.com/restaurant/${restaurant.id}`
      }
    ]
  };
};

const RestaurantProfile = () => {
  const { id } = useParams();
  const { track } = useAnalytics();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Determine if the param is a numeric ID or a slug
  const isNumericId = id ? /^\d+$/.test(id) : false;

  
  const { data: restaurant, isLoading, isFetching, error, dataUpdatedAt } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (!id) throw new Error('Restaurant identifier is required');
      
      let query = supabase
        .from('Merchant')
        .select(`
          *,
          merchant_happy_hour (
            id,
            day_of_week,
            happy_hour_start,
            happy_hour_end
          ),
          merchant_categories (
            id,
            categories (
              id,
              name,
              slug,
              parent_id
            )
          ),
          happy_hour_deals!happy_hour_deals_restaurant_id_fkey (
            id,
            deal_title,
            deal_description,
            active
          )
        `);
      
      // Query by ID if numeric, otherwise by slug
      if (isNumericId) {
        const restaurantId = parseInt(id, 10);
        query = query.eq('id', restaurantId);
      } else {
        query = query.eq('slug', id);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
    placeholderData: keepPreviousData, // Keep previous data during refetch to prevent flash
  });
  
  // 301 redirect from numeric ID to slug URL — only after fresh data confirmed
  // We track the mount time and only redirect once dataUpdatedAt is after mount,
  // preventing stale cached slugs from triggering an incorrect redirect.
  const mountedAt = useMemo(() => Date.now(), []);
  
  useEffect(() => {
    if (isNumericId && restaurant?.slug && !isFetching && dataUpdatedAt >= mountedAt) {
      // Data is confirmed fresh from the database — safe to redirect
      navigate(`/restaurant/${restaurant.slug}`, { replace: true });
    }
  }, [isNumericId, restaurant?.slug, navigate, isFetching, dataUpdatedAt, mountedAt]);
  
  // Track funnel step after we have the restaurant data
  useEffect(() => {
    if (restaurant?.id) {
      trackFunnelStep({ funnelStep: 'profile_viewed', merchantId: restaurant.id, stepOrder: 5 });
    }
  }, [restaurant?.id]);

  // Track scroll depth
  useEffect(() => {
    const scrollDepths = [25, 50, 75, 100];
    const tracked = new Set<number>();
    
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = (scrollTop / documentHeight) * 100;
      
      scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !tracked.has(depth)) {
          tracked.add(depth);
          track({
            eventType: 'scroll',
            eventCategory: 'restaurant_profile',
            eventAction: 'scroll_depth',
            eventLabel: `${depth}%`,
            merchantId: restaurant?.id,
            metadata: { scroll_depth: depth }
          });
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [restaurant?.id, track]);

  const structuredData = useMemo(() => {
    if (!restaurant) return null;
    
    const restaurantSchema = generateRestaurantStructuredData(restaurant);
    const breadcrumbSchema = generateBreadcrumbStructuredData(restaurant);
    
    return [restaurantSchema, breadcrumbSchema];
  }, [restaurant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading restaurant...</h2>
        </div>
      </div>
    );
  }

  // Only show error state if there's an actual error AND we're not refetching (to prevent flash during updates)
  if ((error || !restaurant) && !isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Restaurant not found</h2>
          <Button onClick={() => window.history.back()} className="mt-4">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 ${isMobile ? 'pb-32' : ''}`}>
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <SEOHead
          title={`${restaurant.restaurant_name} - Happy Hour in ${restaurant.city}, ${restaurant.state}`}
          description={`Find happy hour deals and specials at ${restaurant.restaurant_name} in ${restaurant.city}. Check hours, menu, and location details.`}
          keywords={`${restaurant.restaurant_name}, happy hour, ${restaurant.city} bars, ${restaurant.city} restaurants, drink specials`}
          canonical={`https://sipmunchyap.com/restaurant/${restaurant.slug || restaurant.id}`}
          ogImage={restaurant.logo_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
          structuredData={structuredData}
        />
        {isMobile ? (
          <RestaurantHeader 
            merchantId={restaurant.id} 
            merchantName={restaurant.restaurant_name} 
          />
        ) : (
          <PageHeader showSearchBar={true} searchBarVariant="results" />
        )}
        <RestaurantProfileContent restaurant={restaurant} />
        <Footer />
      </div>
      
      {/* Mobile CTA Bar - positioned above bottom nav */}
      {isMobile && (
        <MobileCTABar
          phoneNumber={restaurant.phone_number}
          address={{
            street: restaurant.street_address,
            city: restaurant.city,
            state: restaurant.state,
            zipCode: restaurant.zip_code,
          }}
          website={restaurant.website}
        />
      )}
    </div>
  );
};

export default RestaurantProfile;

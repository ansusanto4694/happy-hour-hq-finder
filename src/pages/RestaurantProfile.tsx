
import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantHeader } from '@/components/RestaurantHeader';
import { RestaurantProfileContent } from '@/components/RestaurantProfileContent';
import { SEOHead } from '@/components/SEOHead';
import { trackFunnelStep } from '@/utils/analytics';

const generateRestaurantStructuredData = (restaurant: any) => {
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const openingHours = restaurant.merchant_happy_hour?.map((hh: any) => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": dayMap[hh.day_of_week],
    "opens": hh.happy_hour_start,
    "closes": hh.happy_hour_end
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
    "latitude": restaurant.latitude,
    "longitude": restaurant.longitude
  } : undefined;

  return {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "LocalBusiness"],
    "name": restaurant.restaurant_name,
    "address": address,
    "telephone": restaurant.phone_number || undefined,
    "url": restaurant.website || undefined,
    "image": restaurant.logo_url || undefined,
    "geo": geo,
    "servesCuisine": cuisineTypes.length > 0 ? cuisineTypes : undefined,
    "openingHoursSpecification": openingHours.length > 0 ? openingHours : undefined,
    "priceRange": "$$",
    "acceptsReservations": "True"
  };
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
        "item": `https://sipmunchyap.com/restaurant/${restaurant.id}`
      }
    ]
  };
};

const RestaurantProfile = () => {
  const { id } = useParams();
  
  useEffect(() => {
    if (id) {
      trackFunnelStep({ funnelStep: 'profile_viewed', merchantId: parseInt(id, 10), stepOrder: 5 });
    }
  }, [id]);
  
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (!id) throw new Error('Restaurant ID is required');
      
      const restaurantId = parseInt(id, 10);
      if (isNaN(restaurantId)) throw new Error('Invalid restaurant ID');
      
      const { data, error } = await supabase
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
          )
        `)
        .eq('id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

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

  if (error || !restaurant) {
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
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${restaurant.restaurant_name} - Happy Hour in ${restaurant.city}, ${restaurant.state}`}
        description={`Find happy hour deals and specials at ${restaurant.restaurant_name} in ${restaurant.city}. Check hours, menu, and location details.`}
        keywords={`${restaurant.restaurant_name}, happy hour, ${restaurant.city} bars, ${restaurant.city} restaurants, drink specials`}
        canonical={`https://sipmunchyap.com/restaurant/${restaurant.id}`}
        ogImage={restaurant.logo_url || "https://lovable.dev/opengraph-image-p98pqg.png"}
        structuredData={structuredData}
      />
      <RestaurantHeader 
        merchantId={restaurant.id} 
        merchantName={restaurant.restaurant_name} 
      />
      <RestaurantProfileContent restaurant={restaurant} />
    </div>
  );
};

export default RestaurantProfile;


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPublicRestaurants, RestaurantPublic } from '@/utils/restaurantService';

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to normalize location and get bounds
const normalizeLocation = async (location: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('normalize-location', {
      body: { location }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn('Location normalization failed:', error);
    return null;
  }
};

interface UseMerchantsProps {
  searchTerm?: string;
  categoryIds?: string[];
  startTime?: string;
  endTime?: string;
  location?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  radiusMiles?: number;
  showOffersOnly?: boolean;
  selectedDays?: number[];
}

export const useMerchants = ({ 
  searchTerm, 
  categoryIds, 
  startTime, 
  endTime, 
  location, 
  bounds, 
  radiusMiles,
  showOffersOnly,
  selectedDays
}: UseMerchantsProps) => {
  const { data: merchants, isLoading, error } = useQuery({
    queryKey: ['merchants', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays }],
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH (ANONYMOUS FRIENDLY) ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays });
      
      try {
        // First, normalize the location if provided to get proper bounds
        let effectiveBounds = bounds;
        let locationData = null;
        
        if (location && !bounds) {
          console.log('Normalizing location:', location);
          locationData = await normalizeLocation(location);
          if (locationData && locationData.north_lat && locationData.south_lat) {
            effectiveBounds = {
              north: locationData.north_lat,
              south: locationData.south_lat,
              east: locationData.east_lng,
              west: locationData.west_lng
            };
            console.log('Location normalized to bounds:', effectiveBounds);
          }
        }

        // Get basic restaurant data from public view
        let restaurants = await getPublicRestaurants({
          searchTerm,
          bounds: effectiveBounds
        });

        console.log('Found restaurants from public view:', restaurants.length);

        // Filter by categories if specified
        if (categoryIds && categoryIds.length > 0) {
          try {
            const { data: categoryMerchants } = await supabase
              .from('merchant_categories')
              .select('merchant_id')
              .in('category_id', categoryIds);
            
            const merchantIdsFromCategories = categoryMerchants?.map(cm => cm.merchant_id) || [];
            restaurants = restaurants.filter(r => merchantIdsFromCategories.includes(r.id));
            console.log('After category filter:', restaurants.length);
          } catch (error) {
            console.warn('Category filtering failed, continuing without it:', error);
          }
        }

        // Filter by offers if specified
        if (showOffersOnly) {
          try {
            const { data: merchantsWithOffers } = await supabase
              .from('merchant_offers')
              .select('store_id')
              .eq('is_active', true);
            
            const merchantIdsWithOffers = merchantsWithOffers?.map(mo => mo.store_id) || [];
            restaurants = restaurants.filter(r => merchantIdsWithOffers.includes(r.id));
            console.log('After offers filter:', restaurants.length);
          } catch (error) {
            console.warn('Offers filtering failed, continuing without it:', error);
          }
        }

        // Filter by happy hour times if specified
        if ((startTime || endTime || selectedDays) && selectedDays && selectedDays.length > 0) {
          try {
            const { data: happyHours } = await supabase
              .from('merchant_happy_hour')
              .select('store_id, day_of_week, happy_hour_start, happy_hour_end')
              .in('day_of_week', selectedDays);

            if (happyHours) {
              let filteredHappyHours = happyHours;

              // Filter by time if specified
              if (startTime || endTime) {
                filteredHappyHours = happyHours.filter(hh => {
                  // Show places where happy hour overlaps with the requested time window
                  // If user specifies startTime, happy hour should still be active at that time (end >= startTime)
                  if (startTime && hh.happy_hour_end < startTime) return false;
                  // If user specifies endTime, happy hour should have started by that time (start <= endTime)  
                  if (endTime && hh.happy_hour_start > endTime) return false;
                  return true;
                });
              }

              const merchantIdsWithHappyHours = [...new Set(filteredHappyHours.map(hh => hh.store_id))];
              restaurants = restaurants.filter(r => merchantIdsWithHappyHours.includes(r.id));
              console.log('After happy hour filter:', restaurants.length);
            }
          } catch (error) {
            console.warn('Happy hour filtering failed, continuing without it:', error);
          }
        }

        // Apply radius filtering if we have location data and radius
        if (radiusMiles && (effectiveBounds || locationData)) {
          let centerLat, centerLng;
          
          if (locationData && locationData.latitude && locationData.longitude) {
            // Use the exact coordinates from location normalization
            centerLat = locationData.latitude;
            centerLng = locationData.longitude;
          } else if (effectiveBounds) {
            // Calculate center from bounds
            centerLat = (effectiveBounds.north + effectiveBounds.south) / 2;
            centerLng = (effectiveBounds.east + effectiveBounds.west) / 2;
          }
          
          if (centerLat && centerLng) {
            restaurants = restaurants.filter(restaurant => {
              if (!restaurant.latitude || !restaurant.longitude) return false;
              
              const distance = calculateHaversineDistance(
                centerLat, 
                centerLng, 
                restaurant.latitude, 
                restaurant.longitude
              );
              
              const withinRadius = distance <= radiusMiles;
              if (!withinRadius) {
                console.log(`Filtered out ${restaurant.restaurant_name} - distance: ${distance.toFixed(2)} miles > ${radiusMiles} miles`);
              }
              
              return withinRadius;
            });
            
            console.log(`After radius filter (${radiusMiles} miles from ${centerLat}, ${centerLng}):`, restaurants.length);
          }
        }

        console.log('=== FINAL MERCHANT RESULTS ===');
        console.log('Total merchants found:', restaurants.length);
        if (restaurants.length > 0) {
          console.log('Sample results:', restaurants.slice(0, 3).map(r => ({
            name: r.restaurant_name,
            address: `${r.city}, ${r.state}`,
            coords: r.latitude && r.longitude ? `${r.latitude}, ${r.longitude}` : 'No coords'
          })));
        }
        
        return restaurants as RestaurantPublic[];
      } catch (error) {
        console.error('Error in merchant search:', error);
        throw error;
      }
    },
    enabled: true,
  });

  return {
    merchants,
    isLoading,
    error,
  };
};

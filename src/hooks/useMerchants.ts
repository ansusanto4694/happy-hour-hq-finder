import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPublicRestaurants, RestaurantPublic } from '@/utils/restaurantService';
import { generateSearchVariations, createSearchConditions, debugSearchVariations } from '@/utils/searchUtils';

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
      console.log('=== STARTING MERCHANT SEARCH (SECURE) ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays });
      
      try {
        // Get basic restaurant data from public view
        let restaurants = await getPublicRestaurants({
          searchTerm,
          bounds
        });

        console.log('Found restaurants from public view:', restaurants.length);

        // Filter by categories if specified
        if (categoryIds && categoryIds.length > 0) {
          const { data: categoryMerchants } = await supabase
            .from('merchant_categories')
            .select('merchant_id')
            .in('category_id', categoryIds);
          
          const merchantIdsFromCategories = categoryMerchants?.map(cm => cm.merchant_id) || [];
          restaurants = restaurants.filter(r => merchantIdsFromCategories.includes(r.id));
          console.log('After category filter:', restaurants.length);
        }

        // Filter by offers if specified (requires additional query)
        if (showOffersOnly) {
          const { data: merchantsWithOffers } = await supabase
            .from('merchant_offers')
            .select('store_id')
            .eq('is_active', true);
          
          const merchantIdsWithOffers = merchantsWithOffers?.map(mo => mo.store_id) || [];
          restaurants = restaurants.filter(r => merchantIdsWithOffers.includes(r.id));
          console.log('After offers filter:', restaurants.length);
        }

        // Filter by happy hour times if specified (requires additional query for authenticated users)
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
                  if (startTime && hh.happy_hour_start > startTime) return false;
                  if (endTime && hh.happy_hour_end < endTime) return false;
                  return true;
                });
              }

              const merchantIdsWithHappyHours = [...new Set(filteredHappyHours.map(hh => hh.store_id))];
              restaurants = restaurants.filter(r => merchantIdsWithHappyHours.includes(r.id));
              console.log('After happy hour filter:', restaurants.length);
            }
          } catch (error) {
            console.warn('Happy hour filtering requires authentication, skipping:', error);
          }
        }

        // Filter by distance if bounds and radius are specified
        if (bounds && radiusMiles) {
          const centerLat = (bounds.north + bounds.south) / 2;
          const centerLng = (bounds.east + bounds.west) / 2;
          
          restaurants = restaurants.filter(restaurant => {
            if (!restaurant.latitude || !restaurant.longitude) return false;
            
            const distance = calculateHaversineDistance(
              centerLat, 
              centerLng, 
              restaurant.latitude, 
              restaurant.longitude
            );
            
            return distance <= radiusMiles;
          });
          
          console.log('After radius filter:', restaurants.length);
        }

        console.log('=== FINAL MERCHANT RESULTS ===');
        console.log('Total merchants found:', restaurants.length);
        
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
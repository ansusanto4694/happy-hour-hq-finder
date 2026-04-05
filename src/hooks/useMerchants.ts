import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  const distance = R * c;
  
  return distance; // Distance in miles
};

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, bounds?: { north: number; south: number; east: number; west: number }, radiusMiles?: number, showOffersOnly?: boolean, selectedDays?: number[], gpsCoordinates?: { lat: number; lng: number }, carouselId?: string, neighborhood?: string, menuType?: 'all' | 'food_and_drinks' | 'drinks_only') => {
  const queryKey = ['merchants', categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays, gpsCoordinates, carouselId, neighborhood, menuType];
  
  return useQuery({
    queryKey,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      
      try {
      // Call the merchant-api edge function instead of querying Supabase directly
      const { data: response, error: invokeError } = await supabase.functions.invoke('merchant-api', {
        body: {
          action: 'search',
          params: {
            searchTerm: searchTerm?.trim() || undefined,
            categoryIds: categoryIds?.length ? categoryIds : undefined,
            bounds,
            neighborhood,
            carouselId,
          },
        },
      });

      if (invokeError) throw invokeError;
      
      const data = response?.data;
      if (!data) return [];

      // Apply radius filtering if specified - lazy load location normalization
      let filteredData = data;
      if (radiusMiles && (location || gpsCoordinates)) {
        try {
          let locationData = null;
          
          if (gpsCoordinates) {
            locationData = { latitude: gpsCoordinates.lat, longitude: gpsCoordinates.lng };
          } else {
            const trimmedLocation = location!.trim().toLowerCase();
            const zipMatch = location!.match(/\b\d{5}\b/);
            
            // Try all cache strategies in parallel
            const [zipResult, exactResult, cityResult] = await Promise.all([
              zipMatch ? supabase.from('location_cache').select('latitude, longitude').eq('original_input', zipMatch[0]).maybeSingle() : Promise.resolve({ data: null }),
              supabase.from('location_cache').select('latitude, longitude').eq('original_input', trimmedLocation).maybeSingle(),
              (async () => {
                const cityMatch = location!.match(/^([^,]+)/);
                if (cityMatch) {
                  return supabase.from('location_cache').select('latitude, longitude').ilike('original_input', `%${cityMatch[1].trim().toLowerCase()}%`).maybeSingle();
                }
                return { data: null };
              })()
            ]);

            // Use first successful cache result
            locationData = zipResult.data || exactResult.data || cityResult.data;
            
            // Only call edge function as absolute last resort
            if (!locationData) {
              const { data: normalizedLocation, error: normalizeError } = await supabase.functions.invoke('normalize-location', {
                body: { location }
              });
              if (!normalizeError && normalizedLocation) {
                locationData = {
                  latitude: normalizedLocation.latitude,
                  longitude: normalizedLocation.longitude
                };
              }
            }
          }

          if (locationData) {
            filteredData = data?.filter((merchant: any) => {
              if (!merchant.latitude || !merchant.longitude) return false;
              const distance = calculateHaversineDistance(
                locationData.latitude,
                locationData.longitude,
                parseFloat(merchant.latitude.toString()),
                parseFloat(merchant.longitude.toString())
              );
              return distance <= radiusMiles;
            });
          } else {
            return [];
          }
        } catch (error) {
          return [];
        }
      }

      // Apply time and day filtering together to ensure both match the SAME happy hour entry
      if (filteredData) {
        const timeToMinutes = (timeStr: string): number => {
          const parts = timeStr.trim().split(':');
          let hours = parseInt(parts[0]);
          let minutes = parseInt(parts[1].split(' ')[0]);
          if (timeStr.toUpperCase().includes('PM') && hours !== 12) hours += 12;
          else if (timeStr.toUpperCase().includes('AM') && hours === 12) hours = 0;
          return hours * 60 + minutes;
        };

        const hasTimeFilter = startTime && endTime;
        const hasDayFilter = selectedDays && selectedDays.length > 0;
        
        if (hasTimeFilter || hasDayFilter) {
          const startTimeMinutes = hasTimeFilter ? timeToMinutes(startTime) : null;
          const endTimeMinutes = hasTimeFilter ? timeToMinutes(endTime) : null;
          
          filteredData = filteredData.filter((merchant: any) => {
            if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) return false;
            
            return merchant.merchant_happy_hour.some((hh: any) => {
              // Check day filter if specified
              const dayMatches = !hasDayFilter || selectedDays!.includes(hh.day_of_week);
              
              // Check time filter if specified
              let timeMatches = true;
              if (hasTimeFilter) {
                const hhStartMinutes = parseInt(hh.happy_hour_start.split(':')[0]) * 60 + parseInt(hh.happy_hour_start.split(':')[1]);
                const hhEndMinutes = parseInt(hh.happy_hour_end.split(':')[0]) * 60 + parseInt(hh.happy_hour_end.split(':')[1]);
                timeMatches = hhStartMinutes < endTimeMinutes! && hhEndMinutes > startTimeMinutes!;
              }
              
              // Both conditions must be true for the SAME happy hour entry
              return dayMatches && timeMatches;
            });
          });
        }
      }

      // Apply offers filtering if specified
      if (showOffersOnly && filteredData) {
        const now = new Date();
        filteredData = filteredData.filter((merchant: any) => {
          if (!merchant.merchant_offers || merchant.merchant_offers.length === 0) return false;
          return merchant.merchant_offers.some((offer: any) => 
            offer.is_active && new Date(offer.end_time) > now
          );
        });
      }

      // Apply menu type filtering if specified
      if (menuType && menuType !== 'all' && filteredData) {
        filteredData = filteredData.filter((merchant: any) => {
          if (!merchant.happy_hour_deals || merchant.happy_hour_deals.length === 0) return false;
          return merchant.happy_hour_deals.some((deal: any) => 
            deal.active && deal.menu_type === menuType
          );
        });
      }

      return filteredData;
      } catch (error) {
        throw error;
      }
    },
  });
};

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const distance = R * c;
  
  return distance; // Distance in miles
};

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, bounds?: { north: number; south: number; east: number; west: number }, radiusMiles?: number, showOffersOnly?: boolean, selectedDays?: number[], gpsCoordinates?: { lat: number; lng: number }, carouselId?: string, neighborhood?: string, menuType?: 'all' | 'food_and_drinks' | 'drinks_only') => {
  // Force fresh queries for restaurant searches to avoid caching issues
  const queryKey = ['merchants', categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays, gpsCoordinates, carouselId, neighborhood, menuType];
  
  return useQuery({
    queryKey,
    staleTime: 2 * 60 * 1000, // 2 minutes aggressive caching
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    queryFn: async () => {
      
      try {
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
          happy_hour_deals (
            id,
            active,
            menu_type
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
          merchant_offers (
            id,
            is_active,
            end_time
          ),
          merchant_reviews (
            id,
            status,
            merchant_review_ratings (
              rating
            )
          )
        `)
        .eq('is_active', true);

      // Filter by exact neighborhood if provided (case-insensitive)
      if (neighborhood) {
        query = query.ilike('neighborhood', neighborhood);
      }

      let merchantIds: number[] | null = null;

      // Handle carousel filtering if carouselId is provided
      if (carouselId) {
        const { data: carouselMerchants, error: carouselError } = await supabase
          .from('carousel_merchants')
          .select('merchant_id')
          .eq('carousel_id', carouselId)
          .eq('is_active', true);

        if (carouselError) throw carouselError;

        merchantIds = carouselMerchants?.map(cm => cm.merchant_id) || [];

        if (merchantIds.length === 0) {
          return [];
        }

        query = query.in('id', merchantIds);
      }

      // If search term is provided, combine searches into parallel queries
      if (searchTerm && searchTerm.trim()) {
        const searchVariations = generateSearchVariations(searchTerm.trim());
        const nameSearchConditions = createSearchConditions(searchTerm.trim(), 'restaurant_name');
        const categorySearchConditions = createSearchConditions(searchTerm.trim(), 'name');
        const dealSearchConditions = searchVariations.flatMap(variation => [
          `deal_title.ilike.%${variation}%`,
          `deal_description.ilike.%${variation}%`
        ]).join(',');
        
        // Execute all search queries in parallel
        const [
          { data: nameMerchants, error: nameError },
          { data: dealMerchants, error: dealError },
          { data: categoryMatches, error: categoryError }
        ] = await Promise.all([
          supabase
            .from('Merchant')
            .select('id')
            .or(nameSearchConditions)
            .eq('is_active', true),
          supabase
            .from('happy_hour_deals')
            .select('restaurant_id, Merchant!inner(is_active)')
            .or(dealSearchConditions)
            .eq('active', true)
            .eq('Merchant.is_active', true),
          supabase
            .from('categories')
            .select('id')
            .or(categorySearchConditions)
        ]);

        if (nameError) throw nameError;
        if (dealError) throw dealError;
        if (categoryError) throw categoryError;

        // Get merchant IDs from matching categories
        let categoryMerchantIds: number[] = [];
        if (categoryMatches && categoryMatches.length > 0) {
          const { data: merchantsWithCategories, error: merchantCategoryError } = await supabase
            .from('merchant_categories')
            .select('merchant_id, Merchant!inner(is_active)')
            .in('category_id', categoryMatches.map(cat => cat.id))
            .eq('Merchant.is_active', true);

          if (merchantCategoryError) throw merchantCategoryError;
          categoryMerchantIds = merchantsWithCategories?.map(mc => mc.merchant_id) || [];
        }

        // Combine all merchant IDs
        const nameIds = nameMerchants?.map(m => m.id) || [];
        const dealIds = dealMerchants?.map(d => d.restaurant_id) || [];
        merchantIds = [...new Set([...nameIds, ...dealIds, ...categoryMerchantIds])];

        if (merchantIds.length === 0) return [];
        query = query.in('id', merchantIds);
      }

      // Apply category filters if provided
      if (categoryIds && categoryIds.length > 0) {
        const { data: filteredMerchants, error: categoryFilterError } = await supabase
          .from('merchant_categories')
          .select('merchant_id')
          .in('category_id', categoryIds);

        if (categoryFilterError) throw categoryFilterError;

        const categoryFilteredIds = filteredMerchants?.map(mc => mc.merchant_id) || [];

        if (merchantIds) {
          merchantIds = merchantIds.filter(id => categoryFilteredIds.includes(id));
        } else {
          merchantIds = categoryFilteredIds;
        }

        if (merchantIds.length === 0) return [];
        query = query.in('id', merchantIds);
      }

      // Apply location-based filtering if bounds are provided
      if (bounds) {
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east);
      }

      // Execute the main query
      const { data, error } = await query.order('restaurant_name');
      if (error) throw error;

      // Apply radius filtering if specified - lazy load location normalization
      let filteredData = data;
      if (radiusMiles && (location || gpsCoordinates)) {
        try {
          let locationData = null;
          
          if (gpsCoordinates) {
            locationData = { latitude: gpsCoordinates.lat, longitude: gpsCoordinates.lng };
          } else {
            const trimmedLocation = location.trim().toLowerCase();
            const zipMatch = location.match(/\b\d{5}\b/);
            
            // Try all cache strategies in parallel
            const [zipResult, exactResult, cityResult] = await Promise.all([
              zipMatch ? supabase.from('location_cache').select('latitude, longitude').eq('original_input', zipMatch[0]).maybeSingle() : Promise.resolve({ data: null }),
              supabase.from('location_cache').select('latitude, longitude').eq('original_input', trimmedLocation).maybeSingle(),
              (async () => {
                const cityMatch = location.match(/^([^,]+)/);
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
            filteredData = data?.filter(merchant => {
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
          
          filteredData = filteredData.filter(merchant => {
            if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) return false;
            
            return merchant.merchant_happy_hour.some((hh: any) => {
              // Check day filter if specified
              const dayMatches = !hasDayFilter || selectedDays.includes(hh.day_of_week);
              
              // Check time filter if specified
              let timeMatches = true;
              if (hasTimeFilter) {
                const hhStartMinutes = parseInt(hh.happy_hour_start.split(':')[0]) * 60 + parseInt(hh.happy_hour_start.split(':')[1]);
                const hhEndMinutes = parseInt(hh.happy_hour_end.split(':')[0]) * 60 + parseInt(hh.happy_hour_end.split(':')[1]);
                timeMatches = hhStartMinutes < endTimeMinutes && hhEndMinutes > startTimeMinutes;
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
        filteredData = filteredData.filter(merchant => {
          if (!merchant.merchant_offers || merchant.merchant_offers.length === 0) return false;
          return merchant.merchant_offers.some((offer: any) => 
            offer.is_active && new Date(offer.end_time) > now
          );
        });
      }

      // Apply menu type filtering if specified
      if (menuType && menuType !== 'all' && filteredData) {
        filteredData = filteredData.filter(merchant => {
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
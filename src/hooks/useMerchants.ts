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

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, coords?: { latitude: number; longitude: number } | null, bounds?: { north: number; south: number; east: number; west: number }, radiusMiles?: number, showOffersOnly?: boolean, selectedDays?: number[]) => {
  // Force fresh queries for restaurant searches to avoid caching issues
  const queryKey = ['merchants', categoryIds, searchTerm, startTime, endTime, location, coords?.latitude, coords?.longitude, bounds, radiusMiles, showOffersOnly, selectedDays];
  
  return useQuery({
    queryKey,
    staleTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 5 * 60 * 1000, // Force fresh data for restaurant searches
    gcTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 10 * 60 * 1000, // React Query v5 uses gcTime instead of cacheTime
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles, showOffersOnly, selectedDays });
      
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
          )
        `)
        .eq('is_active', true);

      let merchantIds: number[] | null = null;

      // If search term is provided, find merchants with matching names, happy hour deals OR categories
      if (searchTerm && searchTerm.trim()) {
        console.log('Searching for term:', searchTerm);
        
        // Debug search variations
        debugSearchVariations(searchTerm.trim());
        
        // Get search variations using the new utility
        const searchVariations = generateSearchVariations(searchTerm.trim());
        console.log('Generated search variations:', searchVariations);
        
        // Search in merchant names first
        const nameSearchConditions = createSearchConditions(searchTerm.trim(), 'restaurant_name');
        console.log('Name search conditions:', nameSearchConditions);
        
        const { data: nameMerchants, error: nameError } = await supabase
          .from('Merchant')
          .select('id')
          .or(nameSearchConditions)
          .eq('is_active', true);

        if (nameError) {
          console.error('Error searching merchant names:', nameError);
          throw nameError;
        }

        console.log('Found merchants matching name search:', nameMerchants);

        // Search in happy hour deals (only from active merchants)
        const dealSearchConditions = searchVariations.flatMap(variation => [
          `deal_title.ilike.%${variation}%`,
          `deal_description.ilike.%${variation}%`
        ]).join(',');
        
        const { data: dealMerchants, error: dealError } = await supabase
          .from('happy_hour_deals')
          .select(`
            restaurant_id,
            Merchant!inner(is_active)
          `)
          .or(dealSearchConditions)
          .eq('active', true)
          .eq('Merchant.is_active', true);

        if (dealError) {
          console.error('Error searching happy hour deals:', dealError);
          throw dealError;
        }

        console.log('Found deals matching search:', dealMerchants);

        // Search in categories using the new utility
        const categorySearchConditions = createSearchConditions(searchTerm.trim(), 'name');
        console.log('Category search conditions:', categorySearchConditions);
        
        const { data: categoryMatches, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .or(categorySearchConditions);

        if (categoryError) {
          console.error('Error searching categories:', categoryError);
          throw categoryError;
        }

        console.log('Found categories matching search:', categoryMatches);
        console.log('Category matches count:', categoryMatches?.length || 0);

        // Get merchant IDs from matching categories
        let categoryMerchantIds: number[] = [];
        if (categoryMatches && categoryMatches.length > 0) {
          const categoryIds = categoryMatches.map(cat => cat.id);
          
          const { data: merchantsWithCategories, error: merchantCategoryError } = await supabase
            .from('merchant_categories')
            .select(`
              merchant_id,
              Merchant!inner(is_active)
            `)
            .in('category_id', categoryIds)
            .eq('Merchant.is_active', true);

          if (merchantCategoryError) {
            console.error('Error getting merchants by category:', merchantCategoryError);
            throw merchantCategoryError;
          }

          categoryMerchantIds = merchantsWithCategories?.map(mc => mc.merchant_id) || [];
          console.log('Found merchant IDs from category search:', categoryMerchantIds);
        }

        // Combine all merchant IDs from name, deal, and category searches
        const nameIds = nameMerchants?.map(m => m.id) || [];
        const dealIds = dealMerchants?.map(d => d.restaurant_id) || [];
        
        merchantIds = [...new Set([...nameIds, ...dealIds, ...categoryMerchantIds])];
        console.log('Combined merchant IDs from all searches:', merchantIds);

        if (merchantIds.length === 0) {
          console.log('No merchants found matching search criteria');
          return [];
        }

        // Filter query to only include matching merchants
        query = query.in('id', merchantIds);
      }

      // Apply category filters if provided
      if (categoryIds && categoryIds.length > 0) {
        console.log('Applying category filters:', categoryIds);
        
        const { data: filteredMerchants, error: categoryFilterError } = await supabase
          .from('merchant_categories')
          .select('merchant_id')
          .in('category_id', categoryIds);

        if (categoryFilterError) {
          console.error('Error filtering by categories:', categoryFilterError);
          throw categoryFilterError;
        }

        const categoryFilteredIds = filteredMerchants?.map(mc => mc.merchant_id) || [];
        console.log('Merchant IDs matching category filters:', categoryFilteredIds);

        if (merchantIds) {
          // Intersect with existing search results
          merchantIds = merchantIds.filter(id => categoryFilteredIds.includes(id));
        } else {
          // Use category filter as the only filter
          merchantIds = categoryFilteredIds;
        }

        if (merchantIds.length === 0) {
          console.log('No merchants found after applying category filters');
          return [];
        }

        query = query.in('id', merchantIds);
      }

      // Apply location-based filtering if bounds are provided
      if (bounds) {
        console.log('Applying map bounds filter:', bounds);
        query = query
          .gte('latitude', bounds.south)
          .lte('latitude', bounds.north)
          .gte('longitude', bounds.west)
          .lte('longitude', bounds.east);
      }

      // Execute the main query
      const { data, error } = await query.order('restaurant_name');

      if (error) {
        console.error('Error fetching merchants:', error);
        throw error;
      }

      console.log('Raw merchant data from database:', data);

      // Keep original dataset for potential fallbacks
      const dataAll = data;
      // Apply radius filtering if specified (must have location or coords)
      let filteredData = data;
      if (radiusMiles && (coords || location)) {
        console.log('Applying radius filtering:', radiusMiles, 'miles from', coords || location);
        
        try {
          // Use provided coordinates if available; otherwise, resolve from location string
          let locationData: { latitude: number; longitude: number } | null = null;
          if (coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
            locationData = coords;
            console.log('Using coordinates from URL:', locationData);
          }
          
          if (!locationData && location) {
            // Enhanced location matching - prioritize zip code for consistency
            const trimmedLocation = location.trim().toLowerCase();
            
            // Strategy 1: First check for zip codes in the location string
            const zipMatch = location.match(/\b\d{5}\b/);
            if (zipMatch) {
              const { data: zipCachedLocation, error: zipCacheError } = await supabase
                .from('location_cache')
                .select('latitude, longitude')
                .eq('original_input', zipMatch[0])
                .single();
                
              if (!zipCacheError && zipCachedLocation) {
                locationData = zipCachedLocation as any;
                console.log('Found zip code in cache:', locationData);
              }
            }
            
            // Strategy 2: If no zip code found, try exact cache match
            if (!locationData) {
              const { data: cachedLocation, error: cacheError } = await supabase
                .from('location_cache')
                .select('latitude, longitude')
                .eq('original_input', trimmedLocation)
                .single();

              if (!cacheError && cachedLocation) {
                locationData = cachedLocation as any;
                console.log('Found exact location in cache:', locationData);
              }
            }
            
            if (!locationData) {
              console.log('Cache strategies failed, trying additional fallbacks...');
              
              // Strategy 3: Try city name extraction for Mapbox formatted strings
              const cityMatch = location.match(/^([^,]+)/);
              if (cityMatch) {
                const cityName = cityMatch[1].trim().toLowerCase();
                const { data: cityCachedLocation, error: cityCacheError } = await supabase
                  .from('location_cache')
                  .select('latitude, longitude')
                  .ilike('original_input', `%${cityName}%`)
                  .single();
                  
                if (!cityCacheError && cityCachedLocation) {
                  locationData = cityCachedLocation as any;
                  console.log('Found city name in cache:', locationData);
                }
              }
              
              // Strategy 4: Normalize the location using edge function as final fallback
              if (!locationData) {
                console.log('Cache strategies failed, normalizing location:', location);
                const { data: normalizedLocation, error: normalizeError } = await supabase.functions.invoke('normalize-location', {
                  body: { location }
                });

                if (normalizeError) {
                  console.error('Error normalizing location:', normalizeError);
                  console.log('Skipping radius filter due to normalization error');
                } else if (normalizedLocation) {
                  locationData = {
                    latitude: (normalizedLocation as any).latitude,
                    longitude: (normalizedLocation as any).longitude
                  };
                  console.log('Normalized location:', locationData);
                }
              }
            }
          }

          if (locationData) {
            filteredData = data?.filter(merchant => {
              if (!merchant.latitude || !merchant.longitude) return false;
              const distance = calculateHaversineDistance(
                locationData!.latitude,
                locationData!.longitude,
                parseFloat(merchant.latitude.toString()),
                parseFloat(merchant.longitude.toString())
              );
              console.log(`Distance from ${merchant.restaurant_name}: ${distance.toFixed(2)} miles`);
              return distance <= radiusMiles;
            });
            console.log(`Merchants after radius filtering (${radiusMiles} miles):`, filteredData?.length || 0);
          } else {
            console.log('Could not get location coordinates for radius filtering, returning empty results');
            return [];
          }
        } catch (error) {
          console.error('Error in radius filtering:', error);
          console.log('Returning empty results due to location error');
          return [];
        }
      }

      // Apply time-based filtering if start and end times are provided
      if (startTime && endTime && filteredData) {
        console.log('Applying time filtering:', startTime, 'to', endTime);
        
        filteredData = filteredData.filter(merchant => {
          if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) {
            return false;
          }

          return merchant.merchant_happy_hour.some((hh: any) => {
            // Helper function to convert time string to minutes
            const timeToMinutes = (timeStr: string): number => {
              const parts = timeStr.trim().split(':');
              let hours = parseInt(parts[0]);
              let minutes = parseInt(parts[1].split(' ')[0]); // Handle "00 PM" format
              
              // Check if it's PM and not 12 PM
              if (timeStr.toUpperCase().includes('PM') && hours !== 12) {
                hours += 12;
              }
              // Handle 12 AM case
              else if (timeStr.toUpperCase().includes('AM') && hours === 12) {
                hours = 0;
              }
              
              return hours * 60 + minutes;
            };

            const startTimeMinutes = timeToMinutes(startTime);
            const endTimeMinutes = timeToMinutes(endTime);
            
            const hhStartMinutes = parseInt(hh.happy_hour_start.split(':')[0]) * 60 + parseInt(hh.happy_hour_start.split(':')[1]);
            const hhEndMinutes = parseInt(hh.happy_hour_end.split(':')[0]) * 60 + parseInt(hh.happy_hour_end.split(':')[1]);

            console.log(`Checking ${merchant.restaurant_name}: User time ${startTime}-${endTime} (${startTimeMinutes}-${endTimeMinutes} min) vs HH ${hh.happy_hour_start}-${hh.happy_hour_end} (${hhStartMinutes}-${hhEndMinutes} min)`);

            // Check if happy hour overlaps with user's specified time window
            return hhStartMinutes < endTimeMinutes && hhEndMinutes > startTimeMinutes;
          });
        });
        
        console.log('Merchants after time filtering:', filteredData);
      }

      // Apply day-of-week filtering if specified
      if (selectedDays && selectedDays.length > 0 && filteredData) {
        console.log('Applying day-of-week filtering:', selectedDays);
        
        filteredData = filteredData.filter(merchant => {
          if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) {
            return false;
          }

          // Check if merchant has happy hours on any of the selected days
          const hasHappyHourOnSelectedDays = merchant.merchant_happy_hour.some((hh: any) => 
            selectedDays.includes(hh.day_of_week)
          );
          
          console.log(`${merchant.restaurant_name} has happy hours on selected days:`, hasHappyHourOnSelectedDays);
          return hasHappyHourOnSelectedDays;
        });
        
        console.log('Merchants after day-of-week filtering:', filteredData?.length || 0);
      }

      // Apply offers filtering if specified
      if (showOffersOnly && filteredData) {
        console.log('Applying offers filtering');
        
        filteredData = filteredData.filter(merchant => {
          if (!merchant.merchant_offers || merchant.merchant_offers.length === 0) {
            return false;
          }
          
          // Check if merchant has any active offers that haven't expired
          const hasActiveOffers = merchant.merchant_offers.some((offer: any) => {
            if (!offer.is_active) return false;
            if (!offer.end_time) return true;
            const t = new Date(offer.end_time).getTime();
            return !Number.isNaN(t) && t > Date.now();
          });
          
          console.log(`${merchant.restaurant_name} has active offers:`, hasActiveOffers);
          return hasActiveOffers;
        });
        
        console.log('Merchants after offers filtering:', filteredData?.length || 0);
      }

      console.log('Final merchants result:', filteredData);
      console.log('Final merchants count:', filteredData?.length || 0);
      
      // Extra debugging for restaurant searches
      if (searchTerm?.toLowerCase().includes('restaurant')) {
        console.log('🔍 RESTAURANT SEARCH FINAL RESULT:');
        console.log('- Search term:', searchTerm);
        console.log('- Result count:', filteredData?.length || 0);
        console.log('- First few results:', filteredData?.slice(0, 3));
        console.log('- Is result truthy?', !!filteredData);
        console.log('- Is result an array?', Array.isArray(filteredData));
      }
      
      return filteredData;
      } catch (error) {
        console.error('=== SEARCH ERROR ===', error);
        throw error;
      }
    },
  });
};
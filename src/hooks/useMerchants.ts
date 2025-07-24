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

export const useMerchants = (categoryIds?: string[], searchTerm?: string, startTime?: string, endTime?: string, location?: string, bounds?: { north: number; south: number; east: number; west: number }, radiusMiles?: number) => {
  // Force fresh queries for restaurant searches to avoid caching issues
  const queryKey = ['merchants', categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles];
  
  return useQuery({
    queryKey,
    staleTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 5 * 60 * 1000, // Force fresh data for restaurant searches
    gcTime: searchTerm?.toLowerCase().includes('restaurant') ? 0 : 10 * 60 * 1000, // React Query v5 uses gcTime instead of cacheTime
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles });
      
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

      // Apply radius filtering if specified (must have location)
      if (radiusMiles && location) {
        console.log('Applying radius filtering:', radiusMiles, 'miles from', location);
        
        try {
          // First, try to get coordinates from cache
          let locationData = null;
          const { data: cachedLocation, error: cacheError } = await supabase
            .from('location_cache')
            .select('latitude, longitude')
            .eq('original_input', location.trim().toLowerCase())
            .single();

          if (!cacheError && cachedLocation) {
            locationData = cachedLocation;
            console.log('Found location in cache:', locationData);
          } else {
            console.log('Location not in cache, normalizing:', location);
            
            // Normalize the location using the edge function
            const { data: normalizedLocation, error: normalizeError } = await supabase.functions.invoke('normalize-location', {
              body: { location }
            });

            if (normalizeError) {
              console.error('Error normalizing location:', normalizeError);
              console.log('Skipping radius filter due to normalization error');
            } else if (normalizedLocation) {
              locationData = {
                latitude: normalizedLocation.latitude,
                longitude: normalizedLocation.longitude
              };
              console.log('Normalized location:', locationData);
            }
          }

          if (locationData) {
            const filteredData = data?.filter(merchant => {
              if (!merchant.latitude || !merchant.longitude) return false;
              
              const distance = calculateHaversineDistance(
                locationData.latitude,
                locationData.longitude,
                parseFloat(merchant.latitude.toString()),
                parseFloat(merchant.longitude.toString())
              );
              
              console.log(`Distance from ${merchant.restaurant_name}: ${distance.toFixed(2)} miles`);
              return distance <= radiusMiles;
            });
            
            console.log(`Merchants after radius filtering (${radiusMiles} miles):`, filteredData?.length || 0);
            return filteredData;
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
      if (startTime && endTime && data) {
        console.log('Applying time filtering:', startTime, 'to', endTime);
        
        const filteredData = data.filter(merchant => {
          if (!merchant.merchant_happy_hour || merchant.merchant_happy_hour.length === 0) {
            return false;
          }

      return merchant.merchant_happy_hour.some((hh: any) => {
        const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
        const endTimeMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
        
        const hhStartMinutes = parseInt(hh.happy_hour_start.split(':')[0]) * 60 + parseInt(hh.happy_hour_start.split(':')[1]);
        const hhEndMinutes = parseInt(hh.happy_hour_end.split(':')[0]) * 60 + parseInt(hh.happy_hour_end.split(':')[1]);

        // Check if happy hour overlaps with user's specified time window
        return hhStartMinutes < endTimeMinutes && hhEndMinutes > startTimeMinutes;
      });
        });
        
        console.log('Merchants after time filtering:', filteredData);
        return filteredData;
      }

      console.log('Final merchants result:', data);
      console.log('Final merchants count:', data?.length || 0);
      
      // Extra debugging for restaurant searches
      if (searchTerm?.toLowerCase().includes('restaurant')) {
        console.log('🔍 RESTAURANT SEARCH FINAL RESULT:');
        console.log('- Search term:', searchTerm);
        console.log('- Result count:', data?.length || 0);
        console.log('- First few results:', data?.slice(0, 3));
        console.log('- Is result truthy?', !!data);
        console.log('- Is result an array?', Array.isArray(data));
      }
      
      return data;
      } catch (error) {
        console.error('=== SEARCH ERROR ===', error);
        throw error;
      }
    },
  });
};
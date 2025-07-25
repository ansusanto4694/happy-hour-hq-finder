import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { performMerchantSearch, filterMerchantsByCategories } from '@/utils/merchantSearch';
import { filterMerchantsByRadius } from '@/utils/locationFiltering';
import { filterMerchantsByTime } from '@/utils/timeFiltering';

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
        
        merchantIds = await performMerchantSearch(searchTerm);

        if (merchantIds.length === 0) {
          console.log('No merchants found matching search criteria');
          return [];
        }

        // Filter query to only include matching merchants
        query = query.in('id', merchantIds);
      }

      // Apply category filters if provided
      if (categoryIds && categoryIds.length > 0) {
        const categoryFilteredIds = await filterMerchantsByCategories(categoryIds);

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
      let filteredData = data;
      if (radiusMiles && location) {
        try {
          filteredData = await filterMerchantsByRadius(data || [], location, radiusMiles);
          if (filteredData.length === 0) {
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
        filteredData = filterMerchantsByTime(filteredData, startTime, endTime);
        console.log('Merchants after time filtering:', filteredData);
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
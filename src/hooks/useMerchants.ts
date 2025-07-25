import { useQuery } from '@tanstack/react-query';
import { buildBaseMerchantQuery, applyMerchantIdFilter, applyBoundsFilter, executeMerchantQuery } from '@/utils/queryBuilder';
import { applySearchAndCategoryFilters, applyPostQueryFilters } from '@/utils/filterPipeline';
import { generateMerchantQueryKey, getCacheSettings } from '@/utils/queryCache';

export const useMerchants = (
  categoryIds?: string[], 
  searchTerm?: string, 
  startTime?: string, 
  endTime?: string, 
  location?: string, 
  bounds?: { north: number; south: number; east: number; west: number }, 
  radiusMiles?: number
) => {
  const queryKey = generateMerchantQueryKey(categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles);
  const cacheSettings = getCacheSettings(searchTerm);
  
  return useQuery({
    queryKey,
    staleTime: cacheSettings.staleTime,
    gcTime: cacheSettings.gcTime,
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles });
      
      try {
        const filterParams = { searchTerm, categoryIds, location, radiusMiles, startTime, endTime };
        
        // Apply search and category filters to get merchant IDs
        const merchantIds = await applySearchAndCategoryFilters(filterParams);
        
        // Early return if no merchants match the search/category criteria
        if (Array.isArray(merchantIds) && merchantIds.length === 0) {
          return [];
        }

        // Build and execute the main query
        let query = buildBaseMerchantQuery();
        
        if (merchantIds) {
          query = applyMerchantIdFilter(query, merchantIds);
        }
        
        if (bounds) {
          query = applyBoundsFilter(query, bounds);
        }

        const data = await executeMerchantQuery(query);

        // Apply post-query filters (radius and time)
        const filteredData = await applyPostQueryFilters(data || [], filterParams);

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
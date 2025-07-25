import { useQuery } from '@tanstack/react-query';
import { buildBaseMerchantQuery, applyMerchantIdFilter, applyBoundsFilter, executeMerchantQuery } from '@/utils/queryBuilder';
import { applyOptimizedSearchAndCategoryFilters, applyOptimizedPostQueryFilters, measureFilterPerformance } from '@/utils/filterPipeline';
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
  const cacheSettings = getCacheSettings(searchTerm, categoryIds, location);
  
  return useQuery({
    queryKey,
    staleTime: cacheSettings.staleTime,
    gcTime: cacheSettings.gcTime,
    retry: cacheSettings.retry,
    retryDelay: cacheSettings.retryDelay,
    queryFn: async () => {
      console.log('=== STARTING MERCHANT SEARCH ===');
      console.log('Search parameters:', { categoryIds, searchTerm, startTime, endTime, location, bounds, radiusMiles });
      
      try {
        const queryStart = performance.now();
        const filterParams = { searchTerm, categoryIds, location, radiusMiles, startTime, endTime };
        
        // Apply optimized search and category filters with performance monitoring
        const merchantIds = await measureFilterPerformance(
          () => applyOptimizedSearchAndCategoryFilters(filterParams),
          'Search and Category Filtering'
        );
        
        // Debug what we got from search/category filters
        console.log('=== SEARCH/CATEGORY FILTER RESULT ===');
        console.log('merchantIds result:', merchantIds);
        console.log('Is array?', Array.isArray(merchantIds));
        console.log('Length:', merchantIds?.length);
        console.log('=====================================');
        
        // Early return if no merchants match the search/category criteria
        if (Array.isArray(merchantIds) && merchantIds.length === 0) {
          console.log('Early return: empty array from search/category filters');
          return [];
        }

        // Build and execute the main query with performance monitoring
        const data = await measureFilterPerformance(async () => {
          let query = buildBaseMerchantQuery();
          
          console.log('=== QUERY BUILDING ===');
          console.log('merchantIds for query:', merchantIds);
          console.log('bounds for query:', bounds);
          
          if (merchantIds) {
            console.log('Applying merchant ID filter');
            query = applyMerchantIdFilter(query, merchantIds);
          } else {
            console.log('No merchant ID filter - getting all merchants');
          }
          
          if (bounds) {
            console.log('Applying bounds filter');
            query = applyBoundsFilter(query, bounds);
          }

          const result = await executeMerchantQuery(query);
          console.log('Query executed, result count:', result?.length || 0);
          return result;
        }, 'Database Query Execution');

        // Apply post-query filters with performance monitoring
        const filteredData = await measureFilterPerformance(
          () => applyOptimizedPostQueryFilters(data || [], filterParams),
          'Post-Query Filtering'
        );

        const queryEnd = performance.now();
        const totalTime = queryEnd - queryStart;

        console.log(`Total query execution time: ${totalTime.toFixed(2)}ms`);
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
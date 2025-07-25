/**
 * Enhanced cache management with performance optimizations
 */

/**
 * Generate optimized cache keys for merchant queries with better normalization
 */
export const generateMerchantQueryKey = (
  categoryIds?: string[], 
  searchTerm?: string, 
  startTime?: string, 
  endTime?: string, 
  location?: string, 
  bounds?: { north: number; south: number; east: number; west: number }, 
  radiusMiles?: number
): string[] => {
  // Create stable, normalized representations for consistent caching
  const normalizedSearchTerm = searchTerm?.trim().toLowerCase();
  const normalizedLocation = location?.trim().toLowerCase();
  
  // Create a stable, sorted representation of bounds for consistent caching
  const boundsKey = bounds ? 
    `${bounds.north.toFixed(6)},${bounds.south.toFixed(6)},${bounds.east.toFixed(6)},${bounds.west.toFixed(6)}` : 
    undefined;
  
  // Sort category IDs for consistent caching
  const sortedCategoryIds = categoryIds?.length ? [...categoryIds].sort() : undefined;
  
  return [
    'merchants', 
    sortedCategoryIds, 
    normalizedSearchTerm, 
    startTime, 
    endTime, 
    normalizedLocation, 
    boundsKey, 
    radiusMiles?.toString()
  ].filter(Boolean) as string[];
};

/**
 * Enhanced cache settings with intelligent stale time calculation
 */
export const getCacheSettings = (searchTerm?: string, categoryIds?: string[], location?: string) => {
  // Dynamic cache settings based on search complexity
  const isComplexSearch = !!(searchTerm || (categoryIds && categoryIds.length > 0) || location);
  const isRestaurantSearch = searchTerm?.toLowerCase().includes('restaurant');
  
  // More aggressive caching for simple searches, fresh data for complex ones
  const baseStaleTime = isComplexSearch ? 2 * 60 * 1000 : 10 * 60 * 1000; // 2 min vs 10 min
  const baseGcTime = isComplexSearch ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 min vs 30 min
  
  return {
    staleTime: isRestaurantSearch ? 0 : baseStaleTime,
    gcTime: isRestaurantSearch ? 0 : baseGcTime,
    retry: isComplexSearch ? 1 : 3, // Fewer retries for complex searches
    retryDelay: 1000,
  };
};

/**
 * Cache warming strategy for predictive loading
 */
export const shouldWarmCache = (searchTerm?: string, location?: string): boolean => {
  // Warm cache for popular search patterns
  const popularTerms = ['restaurant', 'bar', 'pizza', 'burger', 'coffee'];
  const hasPopularTerm = popularTerms.some(term => 
    searchTerm?.toLowerCase().includes(term)
  );
  
  return hasPopularTerm || !!location;
};

/**
 * Generate cache keys for related searches (for prefetching)
 */
export const getRelatedCacheKeys = (searchTerm?: string): string[][] => {
  if (!searchTerm) return [];
  
  const relatedTerms = [];
  const baseTerm = searchTerm.toLowerCase().trim();
  
  // Generate plural/singular variations
  if (baseTerm.endsWith('s')) {
    relatedTerms.push(baseTerm.slice(0, -1)); // Remove 's'
  } else {
    relatedTerms.push(baseTerm + 's'); // Add 's'
  }
  
  // Generate related search keys
  return relatedTerms.map(term => generateMerchantQueryKey(undefined, term));
};
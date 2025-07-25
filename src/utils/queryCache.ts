/**
 * Generate optimized cache keys for merchant queries
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
  // Create a stable, sorted representation of bounds for consistent caching
  const boundsKey = bounds ? 
    `${bounds.north},${bounds.south},${bounds.east},${bounds.west}` : 
    undefined;
  
  // Sort category IDs for consistent caching
  const sortedCategoryIds = categoryIds ? [...categoryIds].sort() : undefined;
  
  return [
    'merchants', 
    sortedCategoryIds, 
    searchTerm?.trim(), 
    startTime, 
    endTime, 
    location?.trim(), 
    boundsKey, 
    radiusMiles
  ].filter(Boolean) as string[];
};

/**
 * Determine cache settings based on search criteria
 */
export const getCacheSettings = (searchTerm?: string) => {
  // Force fresh data for restaurant searches to avoid caching issues
  const isRestaurantSearch = searchTerm?.toLowerCase().includes('restaurant');
  
  return {
    staleTime: isRestaurantSearch ? 0 : 5 * 60 * 1000, // 5 minutes for non-restaurant searches
    gcTime: isRestaurantSearch ? 0 : 10 * 60 * 1000, // 10 minutes for non-restaurant searches
  };
};
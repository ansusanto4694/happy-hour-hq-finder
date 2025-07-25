import { performMerchantSearch, filterMerchantsByCategories } from './merchantSearch';
import { filterMerchantsByRadius } from './locationFiltering';
import { filterMerchantsByTime } from './timeFiltering';

export interface FilterParams {
  searchTerm?: string;
  categoryIds?: string[];
  location?: string;
  radiusMiles?: number;
  startTime?: string;
  endTime?: string;
}

/**
 * Apply search and category filters to get merchant IDs
 */
export const applySearchAndCategoryFilters = async (params: FilterParams): Promise<number[] | null> => {
  const { searchTerm, categoryIds } = params;
  let merchantIds: number[] | null = null;

  // Apply search term filter
  if (searchTerm && searchTerm.trim()) {
    console.log('Searching for term:', searchTerm);
    
    merchantIds = await performMerchantSearch(searchTerm);

    if (merchantIds.length === 0) {
      console.log('No merchants found matching search criteria');
      return [];
    }
  }

  // Apply category filters
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
  }

  return merchantIds;
};

/**
 * Apply post-query filters (radius and time) to merchant data
 */
export const applyPostQueryFilters = async (
  data: any[], 
  params: FilterParams
): Promise<any[]> => {
  const { location, radiusMiles, startTime, endTime } = params;
  let filteredData = data;

  // Apply radius filtering if specified (must have location)
  if (radiusMiles && location) {
    try {
      filteredData = await filterMerchantsByRadius(filteredData, location, radiusMiles);
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

  return filteredData;
};
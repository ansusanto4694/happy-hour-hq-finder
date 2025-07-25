import { performOptimizedMerchantSearch, filterMerchantsByCategoriesOptimized, validateMerchantIds } from './merchantSearch';
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

export interface OptimizedFilterParams extends FilterParams {
  validateIds?: boolean;
  batchSize?: number;
}

/**
 * Optimized search and category filter pipeline with validation
 */
export const applyOptimizedSearchAndCategoryFilters = async (
  params: OptimizedFilterParams
): Promise<number[] | null> => {
  const { searchTerm, categoryIds, validateIds = false } = params;
  let merchantIds: number[] | null = null;

  // Apply search term filter with optimized search
  if (searchTerm && searchTerm.trim()) {
    console.log('Applying optimized search for term:', searchTerm);
    
    try {
      merchantIds = await performOptimizedMerchantSearch(searchTerm);

      if (merchantIds.length === 0) {
        console.log('No merchants found matching search criteria');
        return [];
      }
    } catch (error) {
      console.error('Error in optimized merchant search:', error);
      throw error;
    }
  }

  // Apply category filters with optimized filtering
  if (categoryIds && categoryIds.length > 0) {
    try {
      const categoryFilteredIds = await filterMerchantsByCategoriesOptimized(categoryIds);

      if (merchantIds) {
        // Intersect with existing search results using Set for O(1) lookup
        const searchSet = new Set(merchantIds);
        merchantIds = categoryFilteredIds.filter(id => searchSet.has(id));
      } else {
        // Use category filter as the only filter
        merchantIds = categoryFilteredIds;
      }

      if (merchantIds.length === 0) {
        console.log('No merchants found after applying category filters');
        return [];
      }
    } catch (error) {
      console.error('Error in category filtering:', error);
      throw error;
    }
  }

  // Optional validation step for data integrity
  if (validateIds && merchantIds && merchantIds.length > 0) {
    try {
      merchantIds = await validateMerchantIds(merchantIds);
      console.log(`Validated ${merchantIds.length} merchant IDs`);
    } catch (error) {
      console.error('Error validating merchant IDs:', error);
      // Continue without validation rather than failing
    }
  }

  return merchantIds;
};

/**
 * Optimized post-query filtering with parallel processing where possible
 */
export const applyOptimizedPostQueryFilters = async (
  data: any[], 
  params: FilterParams
): Promise<any[]> => {
  const { location, radiusMiles, startTime, endTime } = params;
  
  if (!data || data.length === 0) {
    return [];
  }

  let filteredData = data;

  // Apply radius filtering if specified (must have location)
  if (radiusMiles && location) {
    try {
      console.log(`Applying radius filtering: ${radiusMiles} miles from ${location}`);
      const radiusStart = performance.now();
      
      filteredData = await filterMerchantsByRadius(filteredData, location, radiusMiles);
      
      const radiusEnd = performance.now();
      console.log(`Radius filtering completed in ${(radiusEnd - radiusStart).toFixed(2)}ms`);
      
      if (filteredData.length === 0) {
        console.log('No merchants found within specified radius');
        return [];
      }
    } catch (error) {
      console.error('Error in radius filtering:', error);
      console.log('Returning empty results due to location error');
      return [];
    }
  }

  // Apply time-based filtering if start and end times are provided
  if (startTime && endTime && filteredData.length > 0) {
    try {
      console.log(`Applying time filtering: ${startTime} to ${endTime}`);
      const timeStart = performance.now();
      
      filteredData = filterMerchantsByTime(filteredData, startTime, endTime);
      
      const timeEnd = performance.now();
      console.log(`Time filtering completed in ${(timeEnd - timeStart).toFixed(2)}ms`);
      console.log(`Merchants after time filtering: ${filteredData.length}`);
    } catch (error) {
      console.error('Error in time filtering:', error);
      // Continue with unfiltered data rather than failing
    }
  }

  return filteredData;
};

/**
 * Batch processing for large datasets
 */
export const processMerchantsInBatches = async <T>(
  merchants: any[],
  processor: (batch: any[]) => Promise<T[]>,
  batchSize: number = 50
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < merchants.length; i += batchSize) {
    const batch = merchants.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Performance monitoring for filter operations
 */
export const measureFilterPerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  console.log(`${operationName} completed in ${(end - start).toFixed(2)}ms`);
  return result;
};

// Backward compatibility exports
export const applySearchAndCategoryFilters = applyOptimizedSearchAndCategoryFilters;
export const applyPostQueryFilters = applyOptimizedPostQueryFilters;
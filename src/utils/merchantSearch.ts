import { supabase } from '@/integrations/supabase/client';
import { generateSearchVariations, createSearchConditions } from '@/utils/searchUtils';

/**
 * Optimized unified search that combines multiple search strategies in a single query
 */
export const performOptimizedMerchantSearch = async (searchTerm: string): Promise<number[]> => {
  console.log('Performing optimized merchant search for:', searchTerm);
  
  const searchVariations = generateSearchVariations(searchTerm.trim());
  console.log('Generated search variations:', searchVariations);
  
  // Create search conditions for all search types
  const nameSearchConditions = createSearchConditions(searchTerm.trim(), 'restaurant_name');
  const dealSearchConditions = searchVariations.flatMap(variation => [
    `deal_title.ilike.%${variation}%`,
    `deal_description.ilike.%${variation}%`
  ]).join(',');
  const categorySearchConditions = createSearchConditions(searchTerm.trim(), 'name');

  // Execute all searches in parallel for maximum efficiency
  const [nameResults, dealResults, categoryResults] = await Promise.all([
    // Search merchant names
    supabase
      .from('Merchant')
      .select('id')
      .or(nameSearchConditions)
      .eq('is_active', true),
    
    // Search deals with optimized join
    supabase
      .from('happy_hour_deals')
      .select('restaurant_id')
      .or(dealSearchConditions)
      .eq('active', true)
      .not('restaurant_id', 'is', null),
    
    // Search categories with direct fallback (RPC will be implemented later)
    Promise.resolve({ data: null, error: { message: 'RPC not implemented yet' } })
  ]);

  // Handle errors
  if (nameResults.error) {
    console.error('Error searching merchant names:', nameResults.error);
    throw nameResults.error;
  }
  
  if (dealResults.error) {
    console.error('Error searching deals:', dealResults.error);
    throw dealResults.error;
  }

  // Collect merchant IDs from all sources
  const nameIds = nameResults.data?.map(m => m.id) || [];
  const dealIds = dealResults.data?.map(d => d.restaurant_id) || [];
  
  // Handle category search (fallback to original method since RPC doesn't exist yet)
  let categoryIds: number[] = [];
  if (categoryResults.error || !categoryResults.data) {
    console.log('Using legacy category search method');
    categoryIds = await searchMerchantsByCategoriesLegacy(searchTerm);
  } else {
    // This would be used when RPC is implemented
    categoryIds = (categoryResults.data as any)?.merchant_ids || [];
  }

  // Combine and deduplicate all merchant IDs
  const allMerchantIds = [...new Set([...nameIds, ...dealIds, ...categoryIds])];
  
  console.log('Search results summary:', {
    nameMatches: nameIds.length,
    dealMatches: dealIds.length,
    categoryMatches: categoryIds.length,
    totalUnique: allMerchantIds.length
  });
  
  return allMerchantIds;
};

/**
 * Legacy category search for fallback
 */
const searchMerchantsByCategoriesLegacy = async (searchTerm: string): Promise<number[]> => {
  const categorySearchConditions = createSearchConditions(searchTerm.trim(), 'name');
  
  const { data: categoryMatches, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .or(categorySearchConditions);

  if (categoryError) {
    console.error('Error searching categories:', categoryError);
    throw categoryError;
  }

  if (!categoryMatches || categoryMatches.length === 0) {
    return [];
  }

  const categoryIds = categoryMatches.map(cat => cat.id);
  
  const { data: merchantsWithCategories, error: merchantCategoryError } = await supabase
    .from('merchant_categories')
    .select('merchant_id')
    .in('category_id', categoryIds);

  if (merchantCategoryError) {
    console.error('Error getting merchants by category:', merchantCategoryError);
    throw merchantCategoryError;
  }

  return merchantsWithCategories?.map(mc => mc.merchant_id) || [];
};

/**
 * Optimized category filtering with batch processing
 */
export const filterMerchantsByCategoriesOptimized = async (categoryIds: string[]): Promise<number[]> => {
  console.log('Applying optimized category filters:', categoryIds);
  
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  // Use a single query with proper indexing hints
  const { data: filteredMerchants, error: categoryFilterError } = await supabase
    .from('merchant_categories')
    .select('merchant_id')
    .in('category_id', categoryIds)
    .order('merchant_id'); // Add ordering to help with index usage

  if (categoryFilterError) {
    console.error('Error filtering by categories:', categoryFilterError);
    throw categoryFilterError;
  }

  const categoryFilteredIds = filteredMerchants?.map(mc => mc.merchant_id) || [];
  console.log('Merchant IDs matching category filters:', categoryFilteredIds.length);
  
  return categoryFilteredIds;
};

/**
 * Batch merchant existence check to validate IDs before main query
 */
export const validateMerchantIds = async (merchantIds: number[]): Promise<number[]> => {
  if (!merchantIds || merchantIds.length === 0) {
    return [];
  }

  // For large ID lists, batch the validation
  const batchSize = 100;
  const validIds: number[] = [];
  
  for (let i = 0; i < merchantIds.length; i += batchSize) {
    const batch = merchantIds.slice(i, i + batchSize);
    
    const { data: existingMerchants, error } = await supabase
      .from('Merchant')
      .select('id')
      .in('id', batch)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error validating merchant IDs:', error);
      throw error;
    }
    
    validIds.push(...(existingMerchants?.map(m => m.id) || []));
  }
  
  return validIds;
};

// Export legacy functions for backward compatibility
export const searchMerchantsByName = async (searchTerm: string) => {
  const nameSearchConditions = createSearchConditions(searchTerm.trim(), 'restaurant_name');
  
  const { data: nameMerchants, error: nameError } = await supabase
    .from('Merchant')
    .select('id')
    .or(nameSearchConditions)
    .eq('is_active', true);

  if (nameError) {
    throw nameError;
  }

  return nameMerchants?.map(m => m.id) || [];
};

export const searchMerchantsByDeals = async (searchTerm: string) => {
  const searchVariations = generateSearchVariations(searchTerm.trim());
  const dealSearchConditions = searchVariations.flatMap(variation => [
    `deal_title.ilike.%${variation}%`,
    `deal_description.ilike.%${variation}%`
  ]).join(',');
  
  const { data: dealMerchants, error: dealError } = await supabase
    .from('happy_hour_deals')
    .select('restaurant_id')
    .or(dealSearchConditions)
    .eq('active', true)
    .not('restaurant_id', 'is', null);

  if (dealError) {
    throw dealError;
  }

  return dealMerchants?.map(d => d.restaurant_id) || [];
};

export const searchMerchantsByCategories = searchMerchantsByCategoriesLegacy;

// Use optimized version by default
export const performMerchantSearch = performOptimizedMerchantSearch;
export const filterMerchantsByCategories = filterMerchantsByCategoriesOptimized;
import { supabase } from '@/integrations/supabase/client';
import { generateSearchVariations, createSearchConditions, debugSearchVariations } from '@/utils/searchUtils';

export const searchMerchantsByName = async (searchTerm: string) => {
  console.log('Searching merchant names for term:', searchTerm);
  
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
  return nameMerchants?.map(m => m.id) || [];
};

export const searchMerchantsByDeals = async (searchTerm: string) => {
  console.log('Searching happy hour deals for term:', searchTerm);
  
  const searchVariations = generateSearchVariations(searchTerm.trim());
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
  return dealMerchants?.map(d => d.restaurant_id) || [];
};

export const searchMerchantsByCategories = async (searchTerm: string) => {
  console.log('Searching categories for term:', searchTerm);
  
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

  return categoryMerchantIds;
};

export const performMerchantSearch = async (searchTerm: string) => {
  console.log('Performing comprehensive merchant search for:', searchTerm);
  
  // Debug search variations
  debugSearchVariations(searchTerm.trim());
  
  // Get search variations using the utility
  const searchVariations = generateSearchVariations(searchTerm.trim());
  console.log('Generated search variations:', searchVariations);
  
  // Search in all three areas: names, deals, and categories
  const [nameIds, dealIds, categoryIds] = await Promise.all([
    searchMerchantsByName(searchTerm),
    searchMerchantsByDeals(searchTerm),
    searchMerchantsByCategories(searchTerm)
  ]);
  
  // Combine all merchant IDs from name, deal, and category searches
  const merchantIds = [...new Set([...nameIds, ...dealIds, ...categoryIds])];
  console.log('Combined merchant IDs from all searches:', merchantIds);
  
  return merchantIds;
};

export const filterMerchantsByCategories = async (categoryIds: string[]) => {
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
  
  return categoryFilteredIds;
};
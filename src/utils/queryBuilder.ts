import { supabase } from '@/integrations/supabase/client';

export interface QueryOptions {
  categoryIds?: string[];
  searchTerm?: string;
  bounds?: { north: number; south: number; east: number; west: number };
  merchantIds?: number[] | null;
  limit?: number;
  offset?: number;
}

/**
 * Optimized base query with selective field loading based on needs
 */
export const buildOptimizedMerchantQuery = (options: { includeFullDetails?: boolean } = {}) => {
  const { includeFullDetails = true } = options;
  
  if (includeFullDetails) {
    return supabase
      .from('Merchant')
      .select(`
        id,
        restaurant_name,
        street_address,
        street_address_line_2,
        city,
        state,
        zip_code,
        phone_number,
        website,
        logo_url,
        latitude,
        longitude,
        is_active,
        created_at,
        updated_at,
        merchant_happy_hour!inner (
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
  } else {
    // Lightweight query for ID-only searches
    return supabase
      .from('Merchant')
      .select('id, restaurant_name, latitude, longitude')
      .eq('is_active', true);
  }
};

/**
 * Build query with smart index utilization
 */
export const buildBaseMerchantQuery = () => {
  return supabase
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
};

/**
 * Optimized merchant ID filtering with batch processing
 */
export const applyMerchantIdFilter = (query: any, merchantIds: number[]) => {
  // For large ID lists, we could implement pagination here
  if (merchantIds.length > 1000) {
    console.warn('Large merchant ID list detected, consider pagination');
  }
  
  return query.in('id', merchantIds);
};

/**
 * Geographic bounds filtering with spatial optimization
 */
export const applyBoundsFilter = (query: any, bounds: { north: number; south: number; east: number; west: number }) => {
  console.log('Applying optimized map bounds filter:', bounds);
  
  // Apply filters in order of selectivity (latitude first, then longitude)
  return query
    .gte('latitude', bounds.south)
    .lte('latitude', bounds.north)
    .gte('longitude', bounds.west)
    .lte('longitude', bounds.east)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
};

/**
 * Execute query with optimized ordering and optional pagination
 */
export const executeMerchantQuery = async (query: any, options: { limit?: number; offset?: number } = {}) => {
  const { limit, offset } = options;
  
  // Apply pagination if specified
  if (limit) {
    query = query.limit(limit);
  }
  if (offset) {
    query = query.range(offset, offset + (limit || 50) - 1);
  }
  
  // Optimize ordering - use indexed column
  const { data, error } = await query.order('restaurant_name');

  if (error) {
    console.error('Error executing optimized merchant query:', error);
    throw error;
  }

  console.log(`Retrieved ${data?.length || 0} merchants from database`);
  return data;
};

/**
 * Count query for pagination support
 */
export const getMerchantCount = async (
  merchantIds?: number[] | null,
  bounds?: { north: number; south: number; east: number; west: number }
) => {
  let query = supabase
    .from('Merchant')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (merchantIds && merchantIds.length > 0) {
    query = applyMerchantIdFilter(query, merchantIds);
  }
  
  if (bounds) {
    query = applyBoundsFilter(query, bounds);
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Error getting merchant count:', error);
    throw error;
  }
  
  return count || 0;
};

/**
 * Optimized query for map markers (lightweight data)
 */
export const buildMapMarkerQuery = () => {
  return supabase
    .from('Merchant')
    .select(`
      id,
      restaurant_name,
      latitude,
      longitude,
      merchant_categories (
        categories (
          name,
          slug
        )
      )
    `)
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
};
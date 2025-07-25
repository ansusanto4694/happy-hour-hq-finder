import { supabase } from '@/integrations/supabase/client';

export interface QueryOptions {
  categoryIds?: string[];
  searchTerm?: string;
  bounds?: { north: number; south: number; east: number; west: number };
  merchantIds?: number[] | null;
}

/**
 * Build the base Supabase query for merchants with all necessary joins
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
 * Apply merchant ID filtering to the query
 */
export const applyMerchantIdFilter = (query: any, merchantIds: number[]) => {
  return query.in('id', merchantIds);
};

/**
 * Apply map bounds filtering to the query
 */
export const applyBoundsFilter = (query: any, bounds: { north: number; south: number; east: number; west: number }) => {
  console.log('Applying map bounds filter:', bounds);
  return query
    .gte('latitude', bounds.south)
    .lte('latitude', bounds.north)
    .gte('longitude', bounds.west)
    .lte('longitude', bounds.east);
};

/**
 * Execute the final query with ordering
 */
export const executeMerchantQuery = async (query: any) => {
  const { data, error } = await query.order('restaurant_name');

  if (error) {
    console.error('Error fetching merchants:', error);
    throw error;
  }

  console.log('Raw merchant data from database:', data);
  return data;
};
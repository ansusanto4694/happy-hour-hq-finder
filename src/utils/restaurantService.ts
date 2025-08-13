import { supabase } from '@/integrations/supabase/client';

// Type definitions for restaurant data
export interface RestaurantPublic {
  id: number;
  restaurant_name: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantFull extends RestaurantPublic {
  street_address: string;
  street_address_line_2: string | null;
  phone_number: string | null;
  website: string | null;
}

// Helper function to get public restaurant data (for search results)
export const getPublicRestaurants = async (filters?: {
  searchTerm?: string;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  categoryIds?: string[];
}) => {
  let query = supabase
    .from('restaurants_public')
    .select('*');
    
  // Apply basic filters that can work with the public view
  if (filters?.searchTerm) {
    query = query.ilike('restaurant_name', `%${filters.searchTerm}%`);
  }
  
  if (filters?.bounds) {
    const { north, south, east, west } = filters.bounds;
    query = query
      .gte('latitude', south)
      .lte('latitude', north)
      .gte('longitude', west)
      .lte('longitude', east);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as RestaurantPublic[];
};

// Helper function to get full restaurant details (requires authentication)
export const getRestaurantDetails = async (restaurantId: number) => {
  const { data, error } = await supabase.rpc('get_restaurant_details', {
    restaurant_id: restaurantId
  });
  
  if (error) throw error;
  return data?.[0] as RestaurantFull | null;
};

// Helper function to get restaurant with all related data for authenticated users
export const getRestaurantWithRelations = async (restaurantId: number) => {
  const [restaurant, happyHours, categories, offers] = await Promise.all([
    getRestaurantDetails(restaurantId),
    supabase
      .from('merchant_happy_hour')
      .select('*')
      .eq('store_id', restaurantId),
    supabase
      .from('merchant_categories')
      .select(`
        id,
        categories (
          id,
          name,
          slug,
          description,
          parent_id
        )
      `)
      .eq('merchant_id', restaurantId),
    supabase
      .from('merchant_offers')
      .select('*')
      .eq('store_id', restaurantId)
      .eq('is_active', true)
  ]);
  
  if (!restaurant) return null;
  
  return {
    ...restaurant,
    merchant_happy_hour: happyHours.data || [],
    merchant_categories: categories.data || [],
    merchant_offers: offers.data || []
  };
};
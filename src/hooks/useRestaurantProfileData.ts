import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MerchantOffer } from '@/components/merchant-offers/types';
import { HappyHourDeal } from '@/components/happy-hour-deals/types';

interface MerchantEvent {
  id: number;
  restaurant_id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Cache configuration for optimal performance
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
};

export const useRestaurantProfileData = (restaurantId: number | undefined) => {
  const results = useQueries({
    queries: [
      // Query 1: Restaurant basic data with happy hours and categories
      {
        queryKey: ['restaurant', restaurantId],
        queryFn: async () => {
          if (!restaurantId) throw new Error('Restaurant ID is required');
          
          const { data, error } = await supabase
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
            .eq('id', restaurantId)
            .eq('is_active', true)
            .maybeSingle();

          if (error) throw error;
          return data;
        },
        enabled: !!restaurantId,
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        retry: 2,
      },
      // Query 2: Merchant offers (only active and future)
      {
        queryKey: ['merchant-offers', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('merchant_offers')
            .select('id, offer_name, offer_description, start_time, end_time, store_id, is_active')
            .eq('store_id', restaurantId)
            .eq('is_active', true)
            .gte('end_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(10);

          if (error) throw error;
          return data as MerchantOffer[];
        },
        enabled: !!restaurantId,
        staleTime: 2 * 60 * 1000, // Offers change more frequently, 2 min cache
        gcTime: CACHE_CONFIG.gcTime,
        retry: 1,
      },
      // Query 3: Happy hour deals
      {
        queryKey: ['happy-hour-deals', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('happy_hour_deals')
            .select('id, restaurant_id, deal_title, deal_description, display_order, active, is_verified, verified_at, source_url, source_label')
            .eq('restaurant_id', restaurantId)
            .eq('active', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) throw error;
          return data as HappyHourDeal[];
        },
        enabled: !!restaurantId,
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        retry: 1,
      },
      // Query 4: Restaurant events (recent only)
      {
        queryKey: ['restaurant-events', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('merchant_events')
            .select('id, restaurant_id, title, description, event_date, image_url, created_at')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;
          return data as MerchantEvent[];
        },
        enabled: !!restaurantId,
        staleTime: CACHE_CONFIG.staleTime,
        gcTime: CACHE_CONFIG.gcTime,
        retry: 1,
      },
    ],
  });

  return {
    restaurant: results[0].data,
    offers: results[1].data || [],
    deals: results[2].data || [],
    events: results[3].data || [],
    isLoading: results.some(result => result.isLoading),
    error: results.find(result => result.error)?.error,
  };
};

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
            .eq('id', restaurantId)
            .maybeSingle();

          if (error) throw error;
          return data;
        },
        enabled: !!restaurantId,
      },
      // Query 2: Merchant offers
      {
        queryKey: ['merchant-offers', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('merchant_offers')
            .select('*')
            .eq('store_id', restaurantId)
            .eq('is_active', true)
            .gte('end_time', new Date().toISOString())
            .order('start_time', { ascending: true });

          if (error) throw error;
          return data as MerchantOffer[];
        },
        enabled: !!restaurantId,
      },
      // Query 3: Happy hour deals
      {
        queryKey: ['happy-hour-deals', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('happy_hour_deals')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data as HappyHourDeal[];
        },
        enabled: !!restaurantId,
      },
      // Query 4: Restaurant events
      {
        queryKey: ['restaurant-events', restaurantId],
        queryFn: async () => {
          if (!restaurantId) return [];
          
          const { data, error } = await supabase
            .from('merchant_events')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data as MerchantEvent[];
        },
        enabled: !!restaurantId,
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

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MerchantOffer } from '@/components/merchant-offers/types';

export const useMerchantOffers = (restaurantId: number) => {
  return useQuery({
    queryKey: ['merchant-offers', restaurantId],
    queryFn: async () => {
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
  });
};
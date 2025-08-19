import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HomepageCarousel = {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  merchants: Array<{
    id: string;
    merchant_id: number;
    display_order: number;
    merchant: {
      id: number;
      restaurant_name: string;
      street_address: string;
      street_address_line_2?: string;
      city: string;
      state: string;
      zip_code: string;
      phone_number?: string;
      website?: string;
      latitude?: number;
      longitude?: number;
      logo_url?: string;
    };
  }>;
};

export const useHomepageCarousels = () => {
  return useQuery({
    queryKey: ['homepage-carousels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_carousels')
        .select(`
          id,
          name,
          description,
          display_order,
          carousel_merchants!inner (
            id,
            merchant_id,
            display_order,
            Merchant!inner (
              id,
              restaurant_name,
              street_address,
              street_address_line_2,
              city,
              state,
              zip_code,
              phone_number,
              website,
              latitude,
              longitude,
              logo_url,
              is_active
            )
          )
        `)
        .eq('is_active', true)
        .eq('carousel_merchants.is_active', true)
        .eq('carousel_merchants.Merchant.is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Transform the data to match our expected structure
      return (data || []).map(carousel => ({
        ...carousel,
        merchants: (carousel.carousel_merchants || [])
          .map(cm => ({
            ...cm,
            merchant: cm.Merchant
          }))
          .sort((a, b) => a.display_order - b.display_order)
      })) as HomepageCarousel[];
    },
  });
};
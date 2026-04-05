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
      neighborhood?: string;
      slug?: string;
      merchant_happy_hour?: Array<{
        day_of_week: number;
        happy_hour_start: string;
        happy_hour_end: string;
      }>;
      happy_hour_deals?: Array<{
        id: string;
        active: boolean;
        menu_type: 'food_and_drinks' | 'drinks_only' | null;
      }>;
      merchant_reviews?: Array<{
        id: string;
        status: string;
        merchant_review_ratings?: Array<{
          rating: number;
        }>;
      }>;
    };
  }>;
};

export const useHomepageCarousels = () => {
  return useQuery({
    queryKey: ['homepage-carousels'],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data: response, error: invokeError } = await supabase.functions.invoke('merchant-api', {
        body: { action: 'carousels' },
      });

      if (invokeError) throw invokeError;
      return (response?.data || []) as HomepageCarousel[];
    },
  });
};

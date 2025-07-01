
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMerchants = (categoryIds?: string[]) => {
  return useQuery({
    queryKey: ['merchants', categoryIds],
    queryFn: async () => {
      let query = supabase
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
        `);

      // If category filters are applied, filter by them
      if (categoryIds && categoryIds.length > 0) {
        query = query.in('id', 
          supabase
            .from('merchant_categories')
            .select('merchant_id')
            .in('category_id', categoryIds)
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching merchants:', error);
        throw error;
      }

      return data;
    },
  });
};

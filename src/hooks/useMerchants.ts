
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

      // If category filters are applied, filter by them using OR logic
      if (categoryIds && categoryIds.length > 0) {
        console.log('Filtering by category IDs:', categoryIds);
        
        // Get merchant IDs that have ANY of the selected categories (OR logic)
        const { data: merchantIds, error: merchantIdsError } = await supabase
          .from('merchant_categories')
          .select('merchant_id')
          .in('category_id', categoryIds);

        if (merchantIdsError) {
          console.error('Error fetching merchant IDs:', merchantIdsError);
          throw merchantIdsError;
        }

        console.log('Found merchant IDs with categories:', merchantIds);

        if (merchantIds && merchantIds.length > 0) {
          const ids = merchantIds.map(item => item.merchant_id);
          query = query.in('id', ids);
        } else {
          // No merchants found for the selected categories, return empty result
          return [];
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching merchants:', error);
        throw error;
      }

      console.log('Final merchants result:', data);
      return data;
    },
  });
};

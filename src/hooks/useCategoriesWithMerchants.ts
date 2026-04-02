import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategoriesWithMerchants = () => {
  return useQuery({
    queryKey: ['categories-with-merchants'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('merchant_categories')
        .select('category_id, Merchant!inner(is_active)')
        .eq('Merchant.is_active', true);

      if (error) {
        console.error('Error fetching categories with merchants:', error);
        throw error;
      }

      // Return an array (JSON-serializable) instead of a Set,
      // because react-query-persist-client serializes to localStorage
      // and Sets become plain objects on deserialization.
      return [...new Set(data?.map(r => r.category_id) || [])];
    },
    staleTime: 5 * 60 * 1000,
  });
};

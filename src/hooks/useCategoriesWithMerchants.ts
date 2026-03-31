import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategoriesWithMerchants = () => {
  return useQuery({
    queryKey: ['categories-with-merchants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_categories')
        .select('category_id, Merchant!inner(is_active)')
        .eq('Merchant.is_active', true);

      if (error) {
        console.error('Error fetching categories with merchants:', error);
        throw error;
      }

      return new Set(data?.map(r => r.category_id) || []);
    },
    staleTime: 5 * 60 * 1000,
  });
};

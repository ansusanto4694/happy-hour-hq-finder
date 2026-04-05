import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategoriesWithMerchants = () => {
  return useQuery({
    queryKey: ['categories-with-merchants'],
    queryFn: async (): Promise<string[]> => {
      const { data: response, error: invokeError } = await supabase.functions.invoke('merchant-api', {
        body: { action: 'categories_with_merchants' },
      });

      if (invokeError) {
        console.error('Error fetching categories with merchants:', invokeError);
        throw invokeError;
      }

      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

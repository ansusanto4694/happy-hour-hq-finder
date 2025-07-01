
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMerchantCategories = (merchantId?: number) => {
  return useQuery({
    queryKey: ['merchant-categories', merchantId],
    queryFn: async () => {
      if (!merchantId) return [];

      const { data, error } = await supabase
        .from('merchant_categories')
        .select(`
          id,
          category_id,
          categories (
            id,
            name,
            slug,
            parent_id,
            description
          )
        `)
        .eq('merchant_id', merchantId);

      if (error) {
        console.error('Error fetching merchant categories:', error);
        throw error;
      }

      return data;
    },
    enabled: !!merchantId,
  });
};

export const useAddMerchantCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ merchantId, categoryId }: { merchantId: number; categoryId: string }) => {
      const { data, error } = await supabase
        .from('merchant_categories')
        .insert([{ merchant_id: merchantId, category_id: categoryId }])
        .select();

      if (error) {
        console.error('Error adding merchant category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-categories', merchantId] });
    },
  });
};

export const useRemoveMerchantCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ merchantId, categoryId }: { merchantId: number; categoryId: string }) => {
      const { error } = await supabase
        .from('merchant_categories')
        .delete()
        .eq('merchant_id', merchantId)
        .eq('category_id', categoryId);

      if (error) {
        console.error('Error removing merchant category:', error);
        throw error;
      }
    },
    onSuccess: (_, { merchantId }) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-categories', merchantId] });
    },
  });
};

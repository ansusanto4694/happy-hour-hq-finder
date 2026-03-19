import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface StoreHour {
  id: string;
  store_id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export const useMerchantStoreHours = (merchantId: number) => {
  const queryClient = useQueryClient();

  const { data: storeHours, isLoading } = useQuery({
    queryKey: ['merchant-store-hours', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_store_hours')
        .select('*')
        .eq('store_id', merchantId)
        .order('day_of_week');
      if (error) throw error;
      return data as StoreHour[];
    },
  });

  const saveStoreHours = useMutation({
    mutationFn: async (hours: Omit<StoreHour, 'id' | 'store_id'>[]) => {
      // Delete existing
      await supabase
        .from('merchant_store_hours')
        .delete()
        .eq('store_id', merchantId);

      // Insert new
      if (hours.length > 0) {
        const { error } = await supabase
          .from('merchant_store_hours')
          .insert(
            hours.map(h => ({
              store_id: merchantId,
              day_of_week: h.day_of_week,
              open_time: h.open_time,
              close_time: h.close_time,
              is_closed: h.is_closed,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-store-hours', merchantId] });
      toast({ title: 'Store hours saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save store hours', variant: 'destructive' });
    },
  });

  return { storeHours, isLoading, saveStoreHours };
};


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HappyHourDeal, DealFormData } from '../types';

export const useHappyHourDeals = (restaurantId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch happy hour deals for this restaurant
  const { data: deals, isLoading } = useQuery({
    queryKey: ['happy-hour-deals', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('happy_hour_deals')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching happy hour deals:', error);
        throw error;
      }

      return data as HappyHourDeal[];
    },
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (newDeal: DealFormData) => {
      // Get the highest display_order for this restaurant
      const { data: maxOrderData } = await supabase
        .from('happy_hour_deals')
        .select('display_order')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData && maxOrderData[0]?.display_order ? maxOrderData[0].display_order : 0) + 1;

      const { data, error } = await supabase
        .from('happy_hour_deals')
        .insert([{
          restaurant_id: restaurantId,
          display_order: nextOrder,
          ...newDeal
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['happy-hour-deals', restaurantId] });
      toast({ title: 'Success', description: 'Deal created successfully!' });
    },
    onError: (error) => {
      console.error('Error creating deal:', error);
      toast({ title: 'Error', description: 'Failed to create deal. Please try again.' });
    }
  });

  // Update deal mutation
  const updateDealMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HappyHourDeal> }) => {
      const { data, error } = await supabase
        .from('happy_hour_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['happy-hour-deals', restaurantId] });
      toast({ title: 'Success', description: 'Deal updated successfully!' });
    },
    onError: (error) => {
      console.error('Error updating deal:', error);
      toast({ title: 'Error', description: 'Failed to update deal. Please try again.' });
    }
  });

  // Delete deal mutation
  const deleteDealMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('happy_hour_deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['happy-hour-deals', restaurantId] });
      toast({ title: 'Success', description: 'Deal deleted successfully!' });
    },
    onError: (error) => {
      console.error('Error deleting deal:', error);
      toast({ title: 'Error', description: 'Failed to delete deal. Please try again.' });
    }
  });

  // Reorder deals mutation
  const reorderDealsMutation = useMutation({
    mutationFn: async (reorderedDeals: HappyHourDeal[]) => {
      // Update each deal's display_order individually
      const updatePromises = reorderedDeals.map((deal, index) => 
        supabase
          .from('happy_hour_deals')
          .update({ display_order: index + 1 })
          .eq('id', deal.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Check if any updates failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Failed to update some deals');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['happy-hour-deals', restaurantId] });
      toast({ title: 'Success', description: 'Deals reordered successfully!' });
    },
    onError: (error) => {
      console.error('Error reordering deals:', error);
      toast({ title: 'Error', description: 'Failed to reorder deals. Please try again.' });
    }
  });

  return {
    deals,
    isLoading,
    createDealMutation,
    updateDealMutation,
    deleteDealMutation,
    reorderDealsMutation,
    queryClient
  };
};

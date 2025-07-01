
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  restaurant_name: string;
  street_address: string;
  street_address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  website: string;
}

interface HappyHour {
  id: string;
  day_of_week: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

export const useRestaurantMutations = (restaurantId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRestaurantMutation = useMutation({
    mutationFn: async (updates: FormData) => {
      const { error } = await supabase
        .from('Merchant')
        .update(updates)
        .eq('id', restaurantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId.toString()] });
      toast({
        title: "Success",
        description: "Restaurant information updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update restaurant information",
        variant: "destructive",
      });
      console.error('Error updating restaurant:', error);
    },
  });

  const updateHappyHoursMutation = useMutation({
    mutationFn: async (updates: HappyHour[]) => {
      // First, delete existing happy hours
      await supabase
        .from('merchant_happy_hour')
        .delete()
        .eq('store_id', restaurantId);

      // Then insert the updated ones
      if (updates.length > 0) {
        const { error } = await supabase
          .from('merchant_happy_hour')
          .insert(
            updates.map(hh => ({
              store_id: restaurantId,
              day_of_week: hh.day_of_week,
              happy_hour_start: hh.happy_hour_start,
              happy_hour_end: hh.happy_hour_end,
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId.toString()] });
      toast({
        title: "Success",
        description: "Happy hour times updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update happy hour times",
        variant: "destructive",
      });
      console.error('Error updating happy hours:', error);
    },
  });

  return {
    updateRestaurantMutation,
    updateHappyHoursMutation,
  };
};

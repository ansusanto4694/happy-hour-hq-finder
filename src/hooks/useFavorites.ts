import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFavorites = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Get all favorites for the user
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*, Merchant(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Check if a specific merchant is favorited
  const isFavorited = (merchantId: number) => {
    return favorites.some((fav) => fav.merchant_id === merchantId);
  };

  // Add favorite mutation
  const addFavorite = useMutation({
    mutationFn: async (merchantId: number) => {
      if (!userId) throw new Error('Must be logged in to favorite');

      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, merchant_id: merchantId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      toast.success('Added to favorites');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Already in favorites');
      } else {
        toast.error('Failed to add favorite');
      }
    },
  });

  // Remove favorite mutation
  const removeFavorite = useMutation({
    mutationFn: async (merchantId: number) => {
      if (!userId) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('merchant_id', merchantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      toast.success('Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to remove favorite');
    },
  });

  // Toggle favorite
  const toggleFavorite = async (merchantId: number) => {
    if (!userId) {
      toast.error('Please sign in to save favorites');
      return;
    }

    if (isFavorited(merchantId)) {
      await removeFavorite.mutateAsync(merchantId);
    } else {
      await addFavorite.mutateAsync(merchantId);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorited,
    toggleFavorite,
    addFavorite: addFavorite.mutateAsync,
    removeFavorite: removeFavorite.mutateAsync,
  };
};

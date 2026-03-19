import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MerchantOffer {
  id: string;
  store_id: number;
  offer_name: string;
  offer_description: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfferFormData {
  offer_name: string;
  offer_description: string | null;
  start_time: string;
  end_time: string;
}

export const useManageOffers = (merchantId: number) => {
  const queryClient = useQueryClient();
  const queryKey = ['manage-offers', merchantId];

  const { data: offers, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_offers')
        .select('*')
        .eq('store_id', merchantId)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data as MerchantOffer[];
    },
  });

  const createOffer = useMutation({
    mutationFn: async (formData: OfferFormData) => {
      const { error } = await supabase
        .from('merchant_offers')
        .insert({ store_id: merchantId, ...formData });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Offer created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateOffer = useMutation({
    mutationFn: async ({ offerId, formData }: { offerId: string; formData: OfferFormData }) => {
      const { error } = await supabase
        .from('merchant_offers')
        .update(formData)
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Offer updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('merchant_offers')
        .delete()
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Offer deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ offerId, isActive }: { offerId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('merchant_offers')
        .update({ is_active: isActive })
        .eq('id', offerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { offers, isLoading, createOffer, updateOffer, deleteOffer, toggleActive };
};

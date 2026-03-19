import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useMerchantOwnership = (merchantId: number) => {
  const { user, isAdmin } = useAuth();

  const { data: isOwner, isLoading } = useQuery({
    queryKey: ['merchant-ownership', merchantId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('merchant_owners')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      if (error) {
        console.error('Error checking merchant ownership:', error);
        return false;
      }
      return !!data;
    },
    enabled: !!user && !isAdmin,
  });

  return {
    canManage: isAdmin || (isOwner ?? false),
    isLoading: isAdmin ? false : isLoading,
  };
};

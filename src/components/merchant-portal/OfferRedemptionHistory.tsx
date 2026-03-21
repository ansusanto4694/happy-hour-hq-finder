import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface OfferRedemptionHistoryProps {
  offerId: string;
  storeId: number;
}

interface RedemptionWithUser {
  id: string;
  redeemed_at: string;
  user_id: string | null;
  displayName: string;
}

export const OfferRedemptionHistory: React.FC<OfferRedemptionHistoryProps> = ({ offerId, storeId }) => {
  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['offer-redemptions-detail', offerId],
    queryFn: async () => {
      // Fetch redemptions
      const { data: rawRedemptions, error } = await supabase
        .from('offer_redemptions')
        .select('id, redeemed_at, user_id')
        .eq('offer_id', offerId)
        .eq('store_id', storeId)
        .order('redeemed_at', { ascending: false });
      if (error) throw error;
      if (!rawRedemptions?.length) return [] as RedemptionWithUser[];

      // Get unique user IDs (non-null)
      const userIds = [...new Set(rawRedemptions.filter(r => r.user_id).map(r => r.user_id!))];

      // Batch fetch display names
      let displayNames: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profile_display_names')
          .select('id, first_name, last_name_initial')
          .in('id', userIds);
        profiles?.forEach(p => {
          if (p.id) {
            displayNames[p.id] = [p.first_name, p.last_name_initial ? `${p.last_name_initial}.` : ''].filter(Boolean).join(' ');
          }
        });
      }

      return rawRedemptions.map(r => ({
        id: r.id,
        redeemed_at: r.redeemed_at,
        user_id: r.user_id,
        displayName: r.user_id ? (displayNames[r.user_id] || 'User') : 'Guest',
      })) as RedemptionWithUser[];
    },
  });

  const count = redemptions?.length ?? 0;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Redemption History</CardTitle>
          <Badge variant="secondary">{count} total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !count ? (
          <p className="text-sm text-muted-foreground text-center py-6">No redemptions yet for this offer.</p>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {redemptions!.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-md border border-border text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-foreground truncate">{r.displayName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0 ml-3">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{format(new Date(r.redeemed_at), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

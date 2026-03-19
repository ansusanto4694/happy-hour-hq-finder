import React, { useState } from 'react';
import { useManageOffers, type MerchantOffer } from '@/hooks/useManageOffers';
import { OfferForm } from './OfferForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PortalOffersProps {
  merchantId: number;
}

const getOfferStatus = (offer: MerchantOffer) => {
  if (!offer.is_active) return { label: 'Inactive', variant: 'destructive' as const };
  const now = new Date();
  const start = new Date(offer.start_time);
  const end = new Date(offer.end_time);
  if (now < start) return { label: 'Scheduled', variant: 'secondary' as const };
  if (now > end) return { label: 'Expired', variant: 'outline' as const };
  return { label: 'Active', variant: 'default' as const };
};

export const PortalOffers: React.FC<PortalOffersProps> = ({ merchantId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<MerchantOffer | null>(null);
  const { offers, isLoading, createOffer, updateOffer, deleteOffer, toggleActive } = useManageOffers(merchantId);

  // Fetch redemption counts
  const { data: redemptionCounts } = useQuery({
    queryKey: ['offer-redemption-counts', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_redemptions')
        .select('offer_id')
        .eq('store_id', merchantId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(r => {
        counts[r.offer_id] = (counts[r.offer_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Offers</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage time-bounded deals and promotions</p>
        </div>
        {!showCreateForm && !editingOffer && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Offer
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {editingOffer ? 'Edit Offer' : showCreateForm ? 'New Offer' : 'All Offers'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingOffer ? (
            <OfferForm
              initialData={editingOffer}
              onSubmit={(data) => {
                updateOffer.mutate({ offerId: editingOffer.id, formData: data }, { onSuccess: () => setEditingOffer(null) });
              }}
              isSubmitting={updateOffer.isPending}
              onCancel={() => setEditingOffer(null)}
              onDelete={() => {
                deleteOffer.mutate(editingOffer.id, { onSuccess: () => setEditingOffer(null) });
              }}
              isDeleting={deleteOffer.isPending}
              onToggleActive={(isActive) => {
                toggleActive.mutate({ offerId: editingOffer.id, isActive }, {
                  onSuccess: () => setEditingOffer(prev => prev ? { ...prev, is_active: isActive } : null)
                });
              }}
            />
          ) : showCreateForm ? (
            <OfferForm
              onSubmit={(data) => {
                createOffer.mutate(data, { onSuccess: () => setShowCreateForm(false) });
              }}
              isSubmitting={createOffer.isPending}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !offers?.length ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No offers yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first offer to attract more customers.</p>
              <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />Create Offer
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {offers.map(offer => {
                const status = getOfferStatus(offer);
                const count = redemptionCounts?.[offer.id] ?? 0;
                return (
                  <button
                    key={offer.id}
                    onClick={() => setEditingOffer(offer)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{offer.offer_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(offer.start_time), 'MMM d, yyyy h:mm a')} — {format(new Date(offer.end_time), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {count > 0 && (
                        <span className="text-xs font-medium text-primary">{count} redeemed</span>
                      )}
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

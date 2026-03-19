import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { HappyHoursForm } from '@/components/restaurant-profile-editor/HappyHoursForm';
import { useRestaurantMutations } from '@/components/restaurant-profile-editor/useRestaurantMutations';
import { useHappyHourDeals } from '@/components/happy-hour-deals/hooks/useHappyHourDeals';
import { DealForm } from '@/components/happy-hour-deals/DealForm';
import { DealsList } from '@/components/happy-hour-deals/DealsList';
import { HappyHourDeal, DealFormData } from '@/components/happy-hour-deals/types';
import { DropResult } from 'react-beautiful-dnd';

interface PortalHappyHoursProps {
  merchantId: number;
}

export const PortalHappyHours: React.FC<PortalHappyHoursProps> = ({ merchantId }) => {
  const { updateHappyHoursMutation } = useRestaurantMutations(merchantId);

  // Fetch happy hours
  const { data: fetchedHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['merchant-happy-hours-portal', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_happy_hour')
        .select('id, day_of_week, happy_hour_start, happy_hour_end')
        .eq('store_id', merchantId)
        .order('day_of_week');
      if (error) throw error;
      return data;
    },
  });

  const [happyHours, setHappyHours] = useState<{ id: string; day_of_week: number; happy_hour_start: string; happy_hour_end: string }[]>([]);

  useEffect(() => {
    if (fetchedHours) setHappyHours(fetchedHours);
  }, [fetchedHours]);

  const handleHappyHourChange = (index: number, field: 'happy_hour_start' | 'happy_hour_end', value: string) => {
    setHappyHours(prev => prev.map((hh, i) => i === index ? { ...hh, [field]: value } : hh));
  };

  const handleHappyHourDayChange = (index: number, day: number) => {
    setHappyHours(prev => prev.map((hh, i) => i === index ? { ...hh, day_of_week: day } : hh));
  };

  const addHappyHour = () => {
    setHappyHours(prev => [...prev, { id: `new-${Date.now()}`, day_of_week: 0, happy_hour_start: '17:00', happy_hour_end: '19:00' }]);
  };

  const removeHappyHour = (index: number) => {
    setHappyHours(prev => prev.filter((_, i) => i !== index));
  };

  const saveSchedule = () => {
    updateHappyHoursMutation.mutate(happyHours);
  };

  // Deals management
  const {
    deals, isLoading: dealsLoading,
    createDealMutation, updateDealMutation, deleteDealMutation, reorderDealsMutation, queryClient,
  } = useHappyHourDeals(merchantId);

  const [editingDeal, setEditingDeal] = useState<HappyHourDeal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({
    deal_title: '', deal_description: '', active: true,
    source_url: '', source_label: '', is_verified: false, menu_type: 'not_specified',
  });

  const resetForm = () => {
    setFormData({ deal_title: '', deal_description: '', active: true, source_url: '', source_label: '', is_verified: false, menu_type: 'not_specified' });
    setEditingDeal(null);
  };

  const handleEditDeal = (deal: HappyHourDeal) => {
    setEditingDeal(deal);
    setFormData({
      deal_title: deal.deal_title, deal_description: deal.deal_description || '',
      active: deal.active, source_url: deal.source_url || '', source_label: deal.source_label || '',
      is_verified: deal.is_verified ?? false, menu_type: deal.menu_type || 'not_specified',
    });
  };

  const handleSubmitDeal = (data: DealFormData) => {
    const dealData = { ...data, menu_type: data.menu_type === 'not_specified' ? null : data.menu_type };
    if (editingDeal) {
      updateDealMutation.mutate({ id: editingDeal.id, updates: dealData }, { onSuccess: resetForm });
    } else {
      createDealMutation.mutate(dealData, { onSuccess: resetForm });
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !deals) return;
    const reordered = Array.from(deals);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    queryClient.setQueryData(['happy-hour-deals', merchantId], reordered);
    reorderDealsMutation.mutate(reordered);
  };

  if (hoursLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Happy Hours</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your happy hour schedule and menu</p>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Schedule</CardTitle>
          <Button size="sm" onClick={saveSchedule} disabled={updateHappyHoursMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateHappyHoursMutation.isPending ? 'Saving...' : 'Save Schedule'}
          </Button>
        </CardHeader>
        <CardContent>
          <HappyHoursForm
            happyHours={happyHours}
            onHappyHourChange={handleHappyHourChange}
            onHappyHourDayChange={handleHappyHourDayChange}
            onAddHappyHour={addHappyHour}
            onRemoveHappyHour={removeHappyHour}
          />
        </CardContent>
      </Card>

      {/* Menu / Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Happy Hour Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DealForm
            formData={formData}
            setFormData={setFormData}
            editingDeal={editingDeal}
            onSubmit={handleSubmitDeal}
            onCancel={resetForm}
            isLoading={createDealMutation.isPending || updateDealMutation.isPending}
          />
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Current Menu Items</h3>
            <DealsList
              deals={deals || []}
              isLoading={dealsLoading}
              onEdit={handleEditDeal}
              onDelete={(id) => deleteDealMutation.mutate(id)}
              onDragEnd={handleDragEnd}
              isDeleting={deleteDealMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

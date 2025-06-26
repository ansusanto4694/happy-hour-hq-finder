
import React, { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useHappyHourDeals } from './happy-hour-deals/hooks/useHappyHourDeals';
import { DealForm } from './happy-hour-deals/DealForm';
import { DealsList } from './happy-hour-deals/DealsList';
import { HappyHourDeal, DealFormData } from './happy-hour-deals/types';

interface HappyHourDealsManagerProps {
  restaurantId: number;
}

export const HappyHourDealsManager: React.FC<HappyHourDealsManagerProps> = ({ restaurantId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<HappyHourDeal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({
    deal_title: '',
    deal_description: '',
    active: true
  });
  
  const {
    deals,
    isLoading,
    createDealMutation,
    updateDealMutation,
    deleteDealMutation,
    reorderDealsMutation,
    queryClient
  } = useHappyHourDeals(restaurantId);

  const resetForm = () => {
    setFormData({ deal_title: '', deal_description: '', active: true });
    setEditingDeal(null);
  };

  const handleEdit = (deal: HappyHourDeal) => {
    setEditingDeal(deal);
    setFormData({
      deal_title: deal.deal_title,
      deal_description: deal.deal_description || '',
      active: deal.active
    });
  };

  const handleSubmit = (data: DealFormData) => {
    if (editingDeal) {
      updateDealMutation.mutate({
        id: editingDeal.id,
        updates: data
      }, {
        onSuccess: resetForm
      });
    } else {
      createDealMutation.mutate(data, {
        onSuccess: resetForm
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteDealMutation.mutate(id);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !deals) return;

    const reorderedDeals = Array.from(deals);
    const [removed] = reorderedDeals.splice(result.source.index, 1);
    reorderedDeals.splice(result.destination.index, 0, removed);

    // Optimistically update the UI
    queryClient.setQueryData(['happy-hour-deals', restaurantId], reorderedDeals);
    
    // Update the database
    reorderDealsMutation.mutate(reorderedDeals);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Edit className="w-4 h-4 mr-2" />
          Edit Deals
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Happy Hour Deals</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <DealForm
            formData={formData}
            setFormData={setFormData}
            editingDeal={editingDeal}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isLoading={createDealMutation.isPending || updateDealMutation.isPending}
          />

          <div>
            <h3 className="font-semibold mb-3">Current Deals (Drag to reorder)</h3>
            <DealsList
              deals={deals || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDragEnd={handleDragEnd}
              isDeleting={deleteDealMutation.isPending}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface HappyHourDealsManagerProps {
  restaurantId: number;
}

interface HappyHourDeal {
  id: string;
  restaurant_id: number;
  deal_title: string;
  deal_description: string | null;
  active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export const HappyHourDealsManager: React.FC<HappyHourDealsManagerProps> = ({ restaurantId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<HappyHourDeal | null>(null);
  const [formData, setFormData] = useState({
    deal_title: '',
    deal_description: '',
    active: true
  });
  
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
    mutationFn: async (newDeal: { deal_title: string; deal_description: string; active: boolean }) => {
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
      resetForm();
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
      resetForm();
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
      const updates = reorderedDeals.map((deal, index) => ({
        id: deal.id,
        display_order: index + 1
      }));

      const { error } = await supabase
        .from('happy_hour_deals')
        .upsert(updates.map(update => ({ id: update.id, display_order: update.display_order })));

      if (error) throw error;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deal_title.trim()) {
      toast({ title: 'Error', description: 'Deal title is required.' });
      return;
    }

    if (editingDeal) {
      updateDealMutation.mutate({
        id: editingDeal.id,
        updates: formData
      });
    } else {
      createDealMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteDealMutation.mutate(id);
    }
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
          {/* Add/Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold">
              {editingDeal ? 'Edit Deal' : 'Add New Deal'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Deal Title *</label>
              <Input
                value={formData.deal_title}
                onChange={(e) => setFormData({ ...formData, deal_title: e.target.value })}
                placeholder="e.g., 50% off appetizers"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.deal_description}
                onChange={(e) => setFormData({ ...formData, deal_description: e.target.value })}
                placeholder="Additional details about the deal..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <label className="text-sm font-medium">Active</label>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={createDealMutation.isPending || updateDealMutation.isPending}
              >
                {editingDeal ? 'Update Deal' : 'Add Deal'}
              </Button>
              {editingDeal && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Existing Deals List */}
          <div>
            <h3 className="font-semibold mb-3">Current Deals (Drag to reorder)</h3>
            {isLoading ? (
              <div className="text-gray-500">Loading deals...</div>
            ) : !deals || deals.length === 0 ? (
              <div className="text-gray-500 italic">No deals created yet.</div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="deals">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {deals.map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-start justify-between p-3 border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg bg-white' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start space-x-3 flex-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium">{deal.deal_title}</h4>
                                    <Badge variant={deal.active ? "default" : "secondary"}>
                                      {deal.active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {deal.deal_description && (
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{deal.deal_description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(deal)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(deal.id)}
                                  disabled={deleteDealMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { DealFormData, HappyHourDeal } from './types';

interface DealFormProps {
  formData: DealFormData;
  setFormData: (data: DealFormData) => void;
  editingDeal: HappyHourDeal | null;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const DealForm: React.FC<DealFormProps> = ({
  formData,
  setFormData,
  editingDeal,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deal_title.trim()) {
      toast({ title: 'Error', description: 'Deal title is required.' });
      return;
    }

    onSubmit(formData);
  };

  return (
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
          disabled={isLoading}
        >
          {editingDeal ? 'Update Deal' : 'Add Deal'}
        </Button>
        {editingDeal && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

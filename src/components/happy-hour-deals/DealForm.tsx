
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DealFormFields } from './DealFormFields';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deal_title.trim()) {
      toast({ title: 'Error', description: 'Deal title is required.' });
      return;
    }

    if (formData.is_verified && !formData.source_url.trim()) {
      toast({ title: 'Error', description: 'Source URL is required to mark a deal as verified.' });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold">
        {editingDeal ? 'Edit Deal' : 'Add New Deal'}
      </h3>
      
      <DealFormFields
        formData={formData}
        setFormData={setFormData}
        textareaRef={textareaRef}
      />
      
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

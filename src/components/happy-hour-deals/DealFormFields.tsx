
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FormattingToolbar } from './FormattingToolbar';
import { DealFormData } from './types';

interface DealFormFieldsProps {
  formData: DealFormData;
  setFormData: (data: DealFormData) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const DealFormFields: React.FC<DealFormFieldsProps> = ({
  formData,
  setFormData,
  textareaRef
}) => {
  return (
    <>
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
        
        <FormattingToolbar
          textareaRef={textareaRef}
          formData={formData}
          setFormData={setFormData}
        />
        
        <Textarea
          ref={textareaRef}
          value={formData.deal_description}
          onChange={(e) => setFormData({ ...formData, deal_description: e.target.value })}
          placeholder="Additional details about the deal... (Select text and use toolbar to format)"
          rows={4}
          className="rounded-t-none border-t-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        <div className="text-xs text-gray-500 mt-1">
          Tip: Select text and use the formatting buttons above. Use **bold**, *italic*, &lt;u&gt;underline&lt;/u&gt;, ~~strikethrough~~, # Large Text, ## Medium Text, or &lt;small&gt;small text&lt;/small&gt;
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <label className="text-sm font-medium">Active</label>
      </div>
    </>
  );
};

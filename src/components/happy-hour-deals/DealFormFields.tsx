
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

      <div>
        <label className="block text-sm font-medium mb-1">Menu Type</label>
        <Select
          value={formData.menu_type}
          onValueChange={(value) => setFormData({ ...formData, menu_type: value as 'food_and_drinks' | 'drinks_only' | '' })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select menu type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Not Specified</SelectItem>
            <SelectItem value="food_and_drinks">🍽️ Food & Drinks</SelectItem>
            <SelectItem value="drinks_only">🥃 Drinks Only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Specify if this happy hour includes food or is drinks-only
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <label className="text-sm font-medium">Active</label>
      </div>

      <div className="space-y-3 border rounded-md p-3">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.is_verified}
            onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
          />
          <label className="text-sm font-medium">Verified</label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source URL {formData.is_verified ? '*' : ''}</label>
          <Input
            value={formData.source_url}
            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
            placeholder="https://example.com/menu"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Source Label</label>
          <Input
            value={formData.source_label}
            onChange={(e) => setFormData({ ...formData, source_label: e.target.value })}
            placeholder="e.g., Official menu"
          />
        </div>
        <p className="text-xs text-gray-500">If Verified is enabled, a source URL is required.</p>
      </div>
    </>
  );
};

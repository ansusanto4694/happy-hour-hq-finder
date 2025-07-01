import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bold, Italic, Underline, Strikethrough, Undo, Redo, Type } from 'lucide-react';
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

    onSubmit(formData);
  };

  const applyFormatting = (command: string, value?: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText || command === 'fontSize') {
      let formattedText = '';
      
      switch (command) {
        case 'bold':
          formattedText = `**${selectedText}**`;
          break;
        case 'italic':
          formattedText = `*${selectedText}*`;
          break;
        case 'underline':
          formattedText = `__${selectedText}__`;
          break;
        case 'strikethrough':
          formattedText = `~~${selectedText}~~`;
          break;
        case 'fontSize':
          if (value && selectedText) {
            const sizeMap: { [key: string]: string } = {
              'small': '<small>',
              'normal': '',
              'large': '## ',
              'xlarge': '# '
            };
            const endMap: { [key: string]: string } = {
              'small': '</small>',
              'normal': '',
              'large': '',
              'xlarge': ''
            };
            formattedText = `${sizeMap[value]}${selectedText}${endMap[value]}`;
          } else {
            formattedText = selectedText;
          }
          break;
        default:
          formattedText = selectedText;
      }
      
      const newValue = 
        textarea.value.substring(0, start) + 
        formattedText + 
        textarea.value.substring(end);
      
      setFormData({ ...formData, deal_description: newValue });
      
      // Restore focus and selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formattedText.length);
      }, 0);
    } else {
      toast({ title: 'Info', description: 'Please select text to format.' });
    }
  };

  const handleUndo = () => {
    document.execCommand('undo');
  };

  const handleRedo = () => {
    document.execCommand('redo');
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
        
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-white border border-gray-200 rounded-t-md">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('bold')}
            className="h-8 w-8 p-0"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('italic')}
            className="h-8 w-8 p-0"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('underline')}
            className="h-8 w-8 p-0"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('strikethrough')}
            className="h-8 w-8 p-0"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Font Size Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => applyFormatting('fontSize', e.target.value)}
              className="h-8 px-2 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="normal"
              title="Font Size"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="xlarge">X-Large</option>
            </select>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <Textarea
          ref={textareaRef}
          value={formData.deal_description}
          onChange={(e) => setFormData({ ...formData, deal_description: e.target.value })}
          placeholder="Additional details about the deal... (Select text and use toolbar to format)"
          rows={4}
          className="rounded-t-none border-t-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        
        <div className="text-xs text-gray-500 mt-1">
          Tip: Select text and use the formatting buttons above. Use **bold**, *italic*, __underline__, ~~strikethrough~~, # Large Text, ## Medium Text, or &lt;small&gt;small text&lt;/small&gt;
        </div>
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

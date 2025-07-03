
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bold, Italic, Underline, Strikethrough, Undo, Redo } from 'lucide-react';

interface FormattingToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  formData: { deal_description: string };
  setFormData: (data: any) => void;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  textareaRef,
  formData,
  setFormData
}) => {
  const { toast } = useToast();

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
          formattedText = `<u>${selectedText}</u>`;
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
  );
};

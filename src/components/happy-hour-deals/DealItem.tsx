import React from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { HappyHourDeal } from './types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface DealItemProps {
  deal: HappyHourDeal;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onEdit: (deal: HappyHourDeal) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const DealItem: React.FC<DealItemProps> = ({
  deal,
  provided,
  snapshot,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      onDelete(deal.id);
    }
  };

  const preprocessMarkdown = (text: string) => {
    // Split by line breaks to handle each line individually
    const lines = text.split('\n');
    
    return lines.map(line => {
      // If line is empty or just whitespace, create an empty paragraph
      if (line.trim() === '') {
        return '\n&nbsp;\n';
      }
      // Otherwise, wrap the line content
      return line.trim();
    }).join('\n\n'); // Join with double line breaks for proper markdown paragraphs
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`bg-white border rounded-lg shadow-sm p-4 ${
        snapshot.isDragging ? 'shadow-lg rotate-2 cursor-grabbing' : ''
      }`}
      style={{
        ...provided.draggableProps.style,
        transform: snapshot.isDragging 
          ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
          : provided.draggableProps.style?.transform,
      }}
    >
      <div className="flex items-start gap-3">
        <button
          {...provided.dragHandleProps}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing pt-1 p-1 -m-1 rounded transition-colors"
          type="button"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{deal.deal_title}</h4>
            <Badge variant={deal.active ? "default" : "secondary"} className="flex-shrink-0">
              {deal.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {deal.deal_description && (
            <div className="text-sm text-gray-600 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => {
                    // Handle paragraphs with only non-breaking spaces (empty lines)
                    if (children === '&nbsp;') {
                      return <div className="h-4">&nbsp;</div>;
                    }
                    return <p className="mb-0 leading-normal">{children}</p>;
                  },
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  u: ({ children }) => <u className="underline">{children}</u>,
                  s: ({ children }) => <s className="line-through">{children}</s>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-1 leading-normal">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-1 leading-normal">{children}</h2>,
                  small: ({ children }) => <small className="text-xs leading-normal">{children}</small>,
                  br: () => <br />,
                }}
                rehypePlugins={[rehypeRaw]}
              >
                {preprocessMarkdown(deal.deal_description)}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(deal)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

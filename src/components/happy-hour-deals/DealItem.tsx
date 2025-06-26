
import React from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { HappyHourDeal } from './types';

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

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`bg-white border rounded-lg shadow-sm ${
        snapshot.isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      <div className="flex items-start p-4 gap-3">
        <div
          {...provided.dragHandleProps}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing pt-1"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{deal.deal_title}</h4>
            <Badge variant={deal.active ? "default" : "secondary"} className="flex-shrink-0">
              {deal.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {deal.deal_description && (
            <p className="text-sm text-gray-600 whitespace-pre-line">{deal.deal_description}</p>
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

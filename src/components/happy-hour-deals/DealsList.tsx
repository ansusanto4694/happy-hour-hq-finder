
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { HappyHourDeal } from './types';
import { DealItem } from './DealItem';

interface DealsListProps {
  deals: HappyHourDeal[];
  isLoading: boolean;
  onEdit: (deal: HappyHourDeal) => void;
  onDelete: (id: string) => void;
  onDragEnd: (result: DropResult) => void;
  isDeleting: boolean;
}

export const DealsList: React.FC<DealsListProps> = ({
  deals,
  isLoading,
  onEdit,
  onDelete,
  onDragEnd,
  isDeleting
}) => {
  if (isLoading) {
    return <div className="text-gray-500">Loading deals...</div>;
  }

  if (!deals || deals.length === 0) {
    return <div className="text-gray-500 italic">No deals created yet.</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                  <DealItem
                    deal={deal}
                    provided={provided}
                    snapshot={snapshot}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={isDeleting}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

import React, { useState } from 'react';
import { useManageEvents, type MerchantEvent } from '@/hooks/useManageEvents';
import { EventCreateForm } from '@/components/events/EventCreateForm';
import { MerchantEventsList } from '@/components/events/MerchantEventsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

interface PortalEventsProps {
  merchantId: number;
}

export const PortalEvents: React.FC<PortalEventsProps> = ({ merchantId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MerchantEvent | null>(null);
  const { events, isLoading, createEvent, updateEvent, deleteEvent, toggleActive } = useManageEvents(merchantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Events</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your events</p>
        </div>
        {!showCreateForm && !editingEvent && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />Add Event
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {editingEvent ? 'Edit Event' : showCreateForm ? 'New Event' : 'All Events'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editingEvent ? (
            <EventCreateForm
              initialData={editingEvent}
              onSubmit={(data) => {
                updateEvent.mutate({ eventId: editingEvent.id, formData: data }, { onSuccess: () => setEditingEvent(null) });
              }}
              isSubmitting={updateEvent.isPending}
              onCancel={() => setEditingEvent(null)}
              onDelete={() => {
                deleteEvent.mutate(editingEvent.id, { onSuccess: () => setEditingEvent(null) });
              }}
              isDeleting={deleteEvent.isPending}
              onToggleActive={(isActive) => {
                toggleActive.mutate({ eventId: editingEvent.id, isActive }, {
                  onSuccess: () => setEditingEvent(prev => prev ? { ...prev, is_active: isActive } : null)
                });
              }}
            />
          ) : showCreateForm ? (
            <EventCreateForm
              onSubmit={(data) => {
                createEvent.mutate(data, { onSuccess: () => setShowCreateForm(false) });
              }}
              isSubmitting={createEvent.isPending}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MerchantEventsList events={events || []} onEdit={setEditingEvent} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMerchantOwnership } from '@/hooks/useMerchantOwnership';
import { useManageEvents, type MerchantEvent } from '@/hooks/useManageEvents';
import { EventCreateForm } from '@/components/events/EventCreateForm';
import { MerchantEventsList } from '@/components/events/MerchantEventsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Calendar, Tag, Loader2 } from 'lucide-react';

const MerchantPortal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const merchantId = Number(id);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MerchantEvent | null>(null);

  // Fetch merchant info
  const { data: merchant, isLoading: merchantLoading } = useQuery({
    queryKey: ['merchant-portal', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Merchant')
        .select('id, restaurant_name, logo_url, neighborhood, city, slug')
        .eq('id', merchantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNaN(merchantId),
  });

  const { canManage, isLoading: ownershipLoading } = useMerchantOwnership(merchantId);
  const { events, isLoading: eventsLoading, createEvent, updateEvent, deleteEvent, toggleActive } = useManageEvents(merchantId);

  if (!user) return <Navigate to="/auth" replace />;
  if (merchantLoading || ownershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!merchant || isNaN(merchantId)) return <Navigate to="/" replace />;
  if (!canManage) return <Navigate to={`/restaurant/${merchant.slug || merchantId}`} replace />;

  const merchantUrl = `/restaurant/${merchant.slug || merchantId}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24 sm:pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={merchantUrl}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {merchant.logo_url && (
              <img src={merchant.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain border" />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{merchant.restaurant_name}</h1>
              <p className="text-sm text-muted-foreground">Merchant Portal</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events">
          <TabsList className="mb-6">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />Events
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2" disabled>
              <Tag className="h-4 w-4" />Offers
              <span className="text-xs text-muted-foreground ml-1">(Coming soon)</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">{editingEvent ? 'Edit Event' : 'Events'}</CardTitle>
                {!showCreateForm && !editingEvent && (
                  <Button size="sm" onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Event
                  </Button>
                )}
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
                  />
                ) : showCreateForm ? (
                  <EventCreateForm
                    onSubmit={(data) => {
                      createEvent.mutate(data, { onSuccess: () => setShowCreateForm(false) });
                    }}
                    isSubmitting={createEvent.isPending}
                    onCancel={() => setShowCreateForm(false)}
                  />
                ) : eventsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MerchantEventsList
                    events={events || []}
                    onDelete={(id) => deleteEvent.mutate(id)}
                    onEdit={(event) => setEditingEvent(event)}
                    onToggleActive={(id, isActive) => toggleActive.mutate({ eventId: id, isActive })}
                    isDeleting={deleteEvent.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Offers management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MerchantPortal;

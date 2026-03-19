import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MerchantEvent {
  id: number;
  restaurant_id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  event_type: string;
  recurrence_rule: string | null;
  recurrence_day: number | null;
  start_time: string | null;
  end_time: string | null;
  category_tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  image_url?: string;
  event_type: 'one_time' | 'recurring';
  event_date?: string;
  recurrence_rule?: string;
  recurrence_day?: number;
  start_time?: string;
  end_time?: string;
  category_tags: string[];
}

export const EVENT_CATEGORIES = [
  'trivia', 'watch-party', 'live-music', 'karaoke', 'comedy',
  'DJ', 'brunch', 'open-mic', 'sports', 'themed-night',
] as const;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const useManageEvents = (merchantId: number) => {
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['merchant-events-manage', merchantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_events')
        .select('*')
        .eq('restaurant_id', merchantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MerchantEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (formData: EventFormData) => {
      const insertData: any = {
        restaurant_id: merchantId,
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        event_type: formData.event_type,
        category_tags: formData.category_tags,
      };

      if (formData.event_type === 'one_time') {
        insertData.event_date = formData.event_date || null;
      } else {
        insertData.recurrence_rule = formData.recurrence_rule || 'weekly';
        insertData.recurrence_day = formData.recurrence_day ?? null;
      }

      insertData.start_time = formData.start_time || null;
      insertData.end_time = formData.end_time || null;

      const { error } = await supabase.from('merchant_events').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-events-manage', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-events', merchantId] });
      toast({ title: 'Event created successfully' });
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({ title: 'Failed to create event', variant: 'destructive' });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ eventId, formData }: { eventId: number; formData: EventFormData }) => {
      const updateData: any = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        event_type: formData.event_type,
        category_tags: formData.category_tags,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
      };

      if (formData.event_type === 'one_time') {
        updateData.event_date = formData.event_date || null;
        updateData.recurrence_rule = null;
        updateData.recurrence_day = null;
      } else {
        updateData.recurrence_rule = formData.recurrence_rule || 'weekly';
        updateData.recurrence_day = formData.recurrence_day ?? null;
        updateData.event_date = null;
      }

      const { error } = await supabase
        .from('merchant_events')
        .update(updateData)
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-events-manage', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-events', merchantId] });
      toast({ title: 'Event updated successfully' });
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({ title: 'Failed to update event', variant: 'destructive' });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      const { error } = await supabase.from('merchant_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-events-manage', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-events', merchantId] });
      toast({ title: 'Event deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ eventId, isActive }: { eventId: number; isActive: boolean }) => {
      const { error } = await supabase
        .from('merchant_events')
        .update({ is_active: isActive })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant-events-manage', merchantId] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-events', merchantId] });
    },
    onError: () => {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    },
  });

  return { events, isLoading, createEvent, updateEvent, deleteEvent, toggleActive };
};

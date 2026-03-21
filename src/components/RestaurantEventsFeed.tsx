import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ImageIcon, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sortEventsByNextOccurrence, formatNextDate } from '@/utils/eventUtils';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';

interface RestaurantEventsFeedProps {
  restaurantId: number;
}

const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const formatDateTimeSummary = (event: any): string => {
  const parts: string[] = [];
  if (event.nextDate) {
    parts.push(formatNextDate(event.nextDate));
  }
  if (event.start_time) {
    const t = formatTime(event.start_time);
    if (t) parts.push(t);
  }
  return parts.join(' · ') || '';
};

export const RestaurantEventsFeed: React.FC<RestaurantEventsFeedProps> = ({ restaurantId }) => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['restaurant-events', restaurantId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('merchant_events')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .or(`repeat_until.is.null,repeat_until.gte.${today}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sortedEvents = React.useMemo(() => {
    if (!events) return [];
    return sortEventsByNextOccurrence(events);
  }, [events]);

  if (isLoading) return null;
  if (error || !sortedEvents.length) return null;

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2 px-1">Events & Updates</h2>
        <div className="divide-y divide-border rounded-lg bg-card border border-border overflow-hidden">
          {sortedEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="w-full flex items-center gap-3 py-3 px-4 text-left hover:bg-muted/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-md flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <Calendar className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>

              {/* Title + date summary */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatDateTimeSummary(event)}
                </p>
              </div>

              {/* Chevron */}
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
};

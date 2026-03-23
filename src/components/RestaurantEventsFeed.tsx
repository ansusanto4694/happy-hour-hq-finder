import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Share, Repeat, ImageIcon, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sortEventsByNextOccurrence, formatNextDate } from '@/utils/eventUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { EventDetailsModal } from '@/components/EventDetailsModal';

interface RestaurantEventsFeedProps {
  restaurantId: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

/** Short date+time hint for mobile list rows, e.g. "Tue 6 PM" */
const formatDateTimeHint = (event: { nextDate: Date | null; start_time: string | null }): string => {
  const parts: string[] = [];
  if (event.nextDate) {
    parts.push(event.nextDate.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  if (event.start_time) {
    const formatted = formatTime(event.start_time);
    if (formatted) parts.push(formatted);
  }
  return parts.join(' · ') || '';
};

export const RestaurantEventsFeed: React.FC<RestaurantEventsFeedProps> = ({ restaurantId }) => {
  const isMobile = useIsMobile();
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);

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

  const handleShare = (event: any) => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: shareUrl });
    } else {
      navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
    }
  };

  if (isLoading) return null;
  if (error || !sortedEvents.length) return null;

  return (
    <>
      <Card className="shadow-lg border-l-4 border-amber-500 bg-card">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Events & Updates</h2>

          {isMobile ? (
            /* ── Mobile: compact tappable list ── */
            <div className="divide-y divide-border -mx-1">
              {sortedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center gap-3 w-full text-left py-3 px-1 active:bg-muted/50 transition-colors"
                >
                  {/* Small thumbnail */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Title + hint */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTimeHint(event)}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            /* ── Desktop: existing card layout ── */
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <Card key={event.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-20 h-20 ${event.image_url ? 'bg-card' : 'bg-gradient-to-br from-primary/10 to-secondary/10'} border border-border rounded-lg flex items-center justify-center overflow-hidden`}>
                          {event.image_url ? (
                            <img src={event.image_url} alt={event.title} className="w-full h-full object-contain" width={80} height={80} loading="lazy" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {event.event_type === 'recurring' ? (<><Repeat className="h-3 w-3 mr-1" />Weekly</>) : 'One-time'}
                          </Badge>
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {event.nextDate && (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="h-3 w-3" />
                              {event.event_type === 'recurring' ? `Next: ${formatNextDate(event.nextDate)}` : formatNextDate(event.nextDate)}
                            </span>
                          )}
                          {event.event_type === 'recurring' && event.recurrence_day != null && (
                            <span className="flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              Every {DAY_NAMES[event.recurrence_day]}
                            </span>
                          )}
                          {event.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                            </span>
                          )}
                        </div>

                        {event.category_tags && event.category_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.category_tags.map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs capitalize">{tag.replace('-', ' ')}</Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => handleShare(event)} aria-label="Share event" className="flex-shrink-0 self-start">
                        <Share className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile event details modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
      />
    </>
  );
};

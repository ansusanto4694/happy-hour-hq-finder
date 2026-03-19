import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Share, Repeat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantEventsFeedProps {
  restaurantId: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

const getTimeSincePosted = (dateString: string): string => {
  const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return `${Math.floor(diffInDays / 7)}w ago`;
};

export const RestaurantEventsFeed: React.FC<RestaurantEventsFeedProps> = ({ restaurantId }) => {
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

  const handleShare = (event: any) => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: event.title, text: event.description, url: shareUrl });
    } else {
      navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
    }
  };

  if (isLoading) return null;
  if (error || !events?.length) return null;

  return (
    <Card className="shadow-lg border-l-4 border-amber-500 bg-white">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Events & Updates</h2>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border border-border rounded-lg overflow-hidden">
              {event.image_url && (
                <div className="w-full h-48 bg-muted">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {event.event_type === 'recurring' ? (
                        <><Repeat className="h-3 w-3 mr-1" />{event.recurrence_rule || 'recurring'}</>
                      ) : 'Event'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{getTimeSincePosted(event.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleShare(event)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                  >
                    <Share className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
                {event.description && <p className="text-muted-foreground text-sm mb-3">{event.description}</p>}

                <div className="flex flex-wrap gap-2">
                  {event.event_type === 'recurring' && event.recurrence_day != null && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      Every {DAY_NAMES[event.recurrence_day]}
                    </Badge>
                  )}
                  {event.event_type === 'one_time' && event.event_date && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatEventDate(event.event_date)}
                    </Badge>
                  )}
                  {event.start_time && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                    </Badge>
                  )}
                  {event.category_tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag.replace('-', ' ')}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

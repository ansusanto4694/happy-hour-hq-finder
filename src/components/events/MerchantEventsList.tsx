import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Calendar, Clock, Repeat, ImageIcon } from 'lucide-react';
import { type MerchantEvent, DAY_NAMES } from '@/hooks/useManageEvents';

interface MerchantEventsListProps {
  events: MerchantEvent[];
  onEdit: (event: MerchantEvent) => void;
}

const formatTime = (time: string | null) => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
};

export const MerchantEventsList: React.FC<MerchantEventsListProps> = ({ events, onEdit }) => {
  if (!events.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">No events yet</p>
        <p className="text-sm">Create your first event to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map(event => (
        <Card key={event.id} className={`transition-opacity cursor-pointer hover:shadow-md ${!event.is_active ? 'opacity-60' : ''}`} onClick={() => onEdit(event)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Event Image */}
              <div className="flex-shrink-0">
                <div className={`w-20 h-20 ${event.image_url ? 'bg-white' : 'bg-gradient-to-br from-primary/10 to-secondary/10'} border border-border rounded-lg shadow-sm flex items-center justify-center overflow-hidden`}>
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-contain"
                      width={80}
                      height={80}
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {event.event_type === 'recurring' ? (
                      <><Repeat className="h-3 w-3 mr-1" />{event.recurrence_rule}</>
                    ) : 'One-time'}
                  </Badge>
                  {!event.is_active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {event.event_type === 'recurring' && event.recurrence_day != null && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Every {DAY_NAMES[event.recurrence_day]}
                    </span>
                  )}
                  {event.event_type === 'one_time' && event.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    {event.category_tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs capitalize">{tag.replace('-', ' ')}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                aria-label="Edit event"
                className="flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

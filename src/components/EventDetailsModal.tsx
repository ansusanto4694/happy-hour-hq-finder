import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Share, Repeat, ImageIcon, Check } from 'lucide-react';
import { formatNextDate } from '@/utils/eventUtils';
import { toast } from '@/hooks/use-toast';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

interface EventDetailsModalProps {
  event: {
    id: number;
    title: string;
    description: string | null;
    image_url: string | null;
    event_type: string;
    recurrence_day: number | null;
    start_time: string | null;
    end_time: string | null;
    category_tags: string[] | null;
    nextDate: Date | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, open, onOpenChange }) => {
  const [shared, setShared] = useState(false);

  if (!event) return null;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description || '', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
      }
      setShared(true);
      toast({ title: 'Link copied!', description: 'Event link copied to clipboard.' });
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      // User cancelled share dialog — no feedback needed
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Image */}
        {event.image_url ? (
          <div className="w-full h-48 bg-muted">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-5 space-y-4">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-lg">{event.title}</DialogTitle>
              <Badge variant="secondary" className="text-xs capitalize">
                {event.event_type === 'recurring' ? (
                  <><Repeat className="h-3 w-3 mr-1" />Weekly</>
                ) : 'One-time'}
              </Badge>
            </div>
            {event.description && (
              <DialogDescription className="text-sm text-muted-foreground">
                {event.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Date / Time details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {event.nextDate && (
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {event.event_type === 'recurring'
                  ? `Next: ${formatNextDate(event.nextDate)}`
                  : formatNextDate(event.nextDate)}
              </div>
            )}

            {event.event_type === 'recurring' && event.recurrence_day != null && (
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Every {DAY_NAMES[event.recurrence_day]}
              </div>
            )}

            {event.start_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
              </div>
            )}
          </div>

          {/* Tags */}
          {event.category_tags && event.category_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.category_tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs capitalize">
                  {tag.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Share */}
          <Button
            variant={shared ? "default" : "outline"}
            size="sm"
            onClick={handleShare}
            className="w-full transition-all"
          >
            {shared ? (
              <><Check className="h-4 w-4 mr-2" />Copied!</>
            ) : (
              <><Share className="h-4 w-4 mr-2" />Share Event</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

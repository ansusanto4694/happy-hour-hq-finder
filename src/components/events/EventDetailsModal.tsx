import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Repeat, Share, ImageIcon } from 'lucide-react';
import { formatNextDate } from '@/utils/eventUtils';
import { useToast } from '@/hooks/use-toast';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (time: string | null): string | null => {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
};

interface EventDetailsModalProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.description, url: shareUrl });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
      toast({ title: 'Link copied!', description: 'Event link has been copied to your clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Unable to copy link. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Image or placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          )}
        </div>

        <div className="p-5 space-y-4">
          <DialogHeader className="p-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-lg">{event.title}</DialogTitle>
              <Badge variant="secondary" className="text-xs capitalize">
                {event.event_type === 'recurring' ? (
                  <><Repeat className="h-3 w-3 mr-1" />Weekly</>
                ) : 'One-time'}
              </Badge>
            </div>
          </DialogHeader>

          {event.description && (
            <p className="text-sm text-muted-foreground">{event.description}</p>
          )}

          {/* Date, recurrence, time details */}
          <div className="space-y-2 text-sm">
            {event.nextDate && (
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Calendar className="h-4 w-4 text-primary" />
                {event.event_type === 'recurring'
                  ? `Next: ${formatNextDate(event.nextDate)}`
                  : formatNextDate(event.nextDate)}
              </div>
            )}

            {event.event_type === 'recurring' && event.recurrence_day != null && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Repeat className="h-4 w-4" />
                Every {DAY_NAMES[event.recurrence_day]}
              </div>
            )}

            {event.start_time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
              </div>
            )}
          </div>

          {/* Category tags */}
          {event.category_tags && event.category_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.category_tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs capitalize">
                  {tag.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Share button */}
          <Button variant="outline" size="sm" onClick={handleShare} className="w-full">
            <Share className="h-4 w-4 mr-2" />
            Share Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

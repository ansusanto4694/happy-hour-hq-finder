import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Share } from 'lucide-react';

interface MerchantEvent {
  id: number;
  restaurant_id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface RestaurantEventsFeedProps {
  restaurantId: number;
  events: MerchantEvent[];
}

// Helper function to format event date
const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper function to format event time
const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to get time since posted
const getTimeSincePosted = (dateString: string): string => {
  const now = new Date();
  const posted = new Date(dateString);
  const diffInHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};

export const RestaurantEventsFeed: React.FC<RestaurantEventsFeedProps> = ({ restaurantId, events }) => {
  const handleShare = (event: MerchantEvent) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${event.title} - ${window.location.href}`);
    }
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white shadow-lg">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Events & Updates</h2>
        
        <div className="space-y-6">
          {events.map((event) => (
            <Card key={event.id} className="bg-white shadow-sm border border-gray-200 overflow-hidden">
              <CardContent className="p-0">
                {/* Event Image */}
                {event.image_url && (
                  <div className="w-full h-64 bg-gray-200">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Event Content */}
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">📅</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">New Event</p>
                        <p className="text-sm text-gray-500">{getTimeSincePosted(event.created_at)}</p>
                      </div>
                    </div>
                    
                    {/* Share Button */}
                    <button
                      onClick={() => handleShare(event)}
                      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                      title="Share event"
                    >
                      <Share className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Event Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {event.title}
                  </h3>

                  {/* Event Description */}
                  {event.description && (
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Event Date and Time */}
                  {event.event_date && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatEventDate(event.event_date)}</span>
                      </Badge>
                      <Badge variant="secondary" className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatEventTime(event.event_date)}</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

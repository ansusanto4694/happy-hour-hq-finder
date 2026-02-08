import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantEventsFeedProps {
  restaurantId: number;
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

export const RestaurantEventsFeed: React.FC<RestaurantEventsFeedProps> = ({ restaurantId }) => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['restaurant-events', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_events')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching restaurant events:', error);
        throw error;
      }

      return data;
    },
  });

  const buildEventShareUrl = () => {
    const proxyBase = 'https://gohcqazhofdhkghfxfok.supabase.co/functions/v1/og-meta';
    const currentPath = window.location.pathname;
    const proxyUrl = new URL(proxyBase);
    proxyUrl.searchParams.set('path', currentPath);
    proxyUrl.searchParams.set('utm_source', 'share');
    proxyUrl.searchParams.set('utm_medium', 'event');
    return proxyUrl.toString();
  };

  const handleShare = (event: any) => {
    const shareUrl = buildEventShareUrl();
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${event.title} - ${shareUrl}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Events & Updates</h2>
        <div className="text-gray-500">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Events & Updates</h2>
        <div className="text-red-500">Error loading events. Please try again later.</div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Events & Updates</h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">No events posted yet. Check back soon for exciting updates!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
};

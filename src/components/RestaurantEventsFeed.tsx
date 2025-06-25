
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
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
        .from('restaurant_events')
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
                  <div className="flex flex-wrap gap-2 mb-4">
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

                {/* Social Media Style Engagement Section */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>💖 👍 😍 12 reactions</span>
                    <span>3 comments • 8 shares</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <span>👍</span>
                      <span className="font-medium">Like</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <span>💬</span>
                      <span className="font-medium">Comment</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <span>📤</span>
                      <span className="font-medium">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

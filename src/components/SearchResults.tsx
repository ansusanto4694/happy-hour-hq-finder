
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

// Helper function to get day name from day number
const getDayName = (dayNumber: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber] || '';
};

// Helper function to format time
const formatTime = (timeString: string): string => {
  const time = new Date(`1970-01-01T${timeString}`);
  return time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to get today's happy hour
const getTodaysHappyHour = (happyHours: any[]): string => {
  const today = new Date().getDay();
  // Convert Sunday (0) to our format (6), and adjust other days
  const adjustedToday = today === 0 ? 6 : today - 1;
  
  const todaysHour = happyHours.find(hh => hh.day_of_week === adjustedToday);
  if (todaysHour) {
    return `${formatTime(todaysHour.happy_hour_start)} - ${formatTime(todaysHour.happy_hour_end)}`;
  }
  return 'No Happy Hour Today';
};

// Helper function to convert 12-hour time to 24-hour time for comparison
const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  return `${hours.padStart(2, '0')}:${minutes}:00`;
};

// Helper function to check if restaurant's happy hour contains the search time range
const isHappyHourInTimeRange = (happyHours: any[], startTime: string, endTime: string): boolean => {
  if (!startTime || !endTime) return true; // If no time filter, show all

  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;
  
  const todaysHour = happyHours.find(hh => hh.day_of_week === adjustedToday);
  if (!todaysHour) return false; // No happy hour today

  const searchStart = convertTo24Hour(startTime);
  const searchEnd = convertTo24Hour(endTime);
  const happyStart = todaysHour.happy_hour_start;
  const happyEnd = todaysHour.happy_hour_end;

  // Check if the happy hour completely contains the search time range
  // Happy hour start must be <= search start AND happy hour end must be >= search end
  return happyStart <= searchStart && happyEnd >= searchEnd;
};

interface SearchResultsProps {
  startTime?: string;
  endTime?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ startTime, endTime }) => {
  const navigate = useNavigate();

  const { data: restaurants, isLoading, error } = useQuery({
    queryKey: ['restaurants-with-happy-hours', startTime, endTime],
    queryFn: async () => {
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('Merchant')
        .select(`
          *,
          merchant_happy_hour (
            day_of_week,
            happy_hour_start,
            happy_hour_end
          )
        `);

      if (restaurantsError) {
        console.error('Error fetching restaurants:', restaurantsError);
        throw restaurantsError;
      }

      // Filter restaurants based on time range if provided
      const filteredRestaurants = restaurantsData?.filter(restaurant => 
        isHappyHourInTimeRange(restaurant.merchant_happy_hour || [], startTime || '', endTime || '')
      ) || [];

      return filteredRestaurants;
    },
  });

  const handleRestaurantClick = (restaurantId: number) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Loading restaurants...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Error loading restaurants</h2>
        <p className="text-red-600">Please try again later.</p>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">No restaurants found</h2>
        <p className="text-gray-600">
          {startTime && endTime 
            ? `No restaurants found with happy hours that cover the entire ${startTime} - ${endTime} time range today.`
            : 'No restaurants are available at this time.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Happy Hour Results
          {startTime && endTime && (
            <span className="text-base font-normal text-gray-600 ml-2">
              ({startTime} - {endTime} today)
            </span>
          )}
        </h2>
        <p className="text-gray-500">
          {restaurants.length} results found
        </p>
      </div>
      
      <div className="space-y-3">
        {restaurants.map((restaurant) => (
          <Card 
            key={restaurant.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRestaurantClick(restaurant.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Logo placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Logo</span>
                  </div>
                </div>
                
                {/* Restaurant details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {restaurant.restaurant_name}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {restaurant.street_address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                      </p>
                      {restaurant.phone_number && (
                        <p className="text-gray-600 text-sm">
                          {restaurant.phone_number}
                        </p>
                      )}
                    </div>
                    
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
                    </Badge>
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

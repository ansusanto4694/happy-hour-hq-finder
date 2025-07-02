
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface SearchResultsProps {
  merchants?: any[];
  isLoading?: boolean;
  error?: any;
  startTime?: string;
  endTime?: string;
  zipCode?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  merchants, 
  isLoading, 
  error,
  startTime, 
  endTime, 
  zipCode 
}) => {
  const navigate = useNavigate();

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

  if (!merchants || merchants.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">No restaurants found</h2>
        <p className="text-gray-600">
          {startTime && endTime 
            ? `No restaurants found with happy hours that overlap with ${startTime} - ${endTime} today${zipCode ? ` in zip code ${zipCode}` : ''}.`
            : `No restaurants are available${zipCode ? ` in zip code ${zipCode}` : ''} at this time.`
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
          {(startTime && endTime) || zipCode ? (
            <span className="text-base font-normal text-gray-600 ml-2">
              ({startTime && endTime ? `${startTime} - ${endTime} today` : ''}
              {startTime && endTime && zipCode ? ', ' : ''}
              {zipCode ? `zip code ${zipCode}` : ''})
            </span>
          ) : null}
        </h2>
        <p className="text-gray-500">
          {merchants.length} results found
        </p>
      </div>
      
      <div className="space-y-3">
        {merchants.map((restaurant) => (
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

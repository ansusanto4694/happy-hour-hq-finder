
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
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

const RestaurantProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (!id) throw new Error('Restaurant ID is required');
      
      const restaurantId = parseInt(id, 10);
      if (isNaN(restaurantId)) throw new Error('Invalid restaurant ID');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          restaurant_happy_hour (
            day_of_week,
            happy_hour_start,
            happy_hour_end
          )
        `)
        .eq('id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
  
  const handleBackToResults = () => {
    navigate('/results');
  };
  
  const handleGoHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading restaurant...</h2>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Restaurant not found</h2>
          <Button onClick={handleBackToResults} className="mt-4">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  // Sort happy hours by day of week for display
  const sortedHappyHours = (restaurant.restaurant_happy_hour || []).sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToResults}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Results</span>
            </Button>
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-orange-500 transition-colors"
              onClick={handleGoHome}
            >
              Happy.Hour
            </h1>
          </div>
        </div>
      </div>

      {/* Restaurant Profile Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {/* Restaurant Logo and Name */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Logo</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {restaurant.restaurant_name}
                </h1>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Address</h2>
                  <div className="text-gray-700">
                    <p>{restaurant.street_address}</p>
                    {restaurant.street_address_line_2 && (
                      <p>{restaurant.street_address_line_2}</p>
                    )}
                    <p>{restaurant.city}, {restaurant.state} {restaurant.zip_code}</p>
                  </div>
                </div>

                {/* Phone Number */}
                {restaurant.phone_number && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h2>
                    <p className="text-gray-700">{restaurant.phone_number}</p>
                  </div>
                )}

                {/* Happy Hours */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Happy Hours</h2>
                  <div className="space-y-1">
                    {sortedHappyHours.length > 0 ? (
                      sortedHappyHours.map((happyHour) => (
                        <div key={happyHour.day_of_week} className="flex justify-between">
                          <span className="text-gray-600">{getDayName(happyHour.day_of_week)}:</span>
                          <span className="text-gray-700">
                            {formatTime(happyHour.happy_hour_start)} - {formatTime(happyHour.happy_hour_end)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No happy hour information available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Happy Hour Deals Placeholder */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Happy Hour Deals</h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-500 italic">Happy hour deals information will be available soon.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantProfile;

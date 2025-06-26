
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RestaurantBasicInfo } from '@/components/RestaurantBasicInfo';
import { RestaurantContactInfo } from '@/components/RestaurantContactInfo';
import { RestaurantHappyHours } from '@/components/RestaurantHappyHours';
import { RestaurantDealsSection } from '@/components/RestaurantDealsSection';
import { RestaurantEventsFeed } from '@/components/RestaurantEventsFeed';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  street_address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  restaurant_happy_hour: Array<{
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
}

interface RestaurantProfileContentProps {
  restaurant: Restaurant;
}

export const RestaurantProfileContent: React.FC<RestaurantProfileContentProps> = ({ restaurant }) => {
  // Transform the restaurant_happy_hour data to include IDs for the editor
  const restaurantWithIds = {
    ...restaurant,
    restaurant_happy_hour: restaurant.restaurant_happy_hour.map(hh => ({
      ...hh,
      id: `${restaurant.id}-${hh.day_of_week}`, // Create a unique ID
    }))
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Restaurant Basic Info Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            <RestaurantBasicInfo restaurantName={restaurant.restaurant_name} />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <RestaurantContactInfo
                  streetAddress={restaurant.street_address}
                  streetAddressLine2={restaurant.street_address_line_2}
                  city={restaurant.city}
                  state={restaurant.state}
                  zipCode={restaurant.zip_code}
                  phoneNumber={restaurant.phone_number}
                />

                <RestaurantHappyHours happyHours={restaurant.restaurant_happy_hour || []} />
              </div>

              {/* Right Column - Restaurant Profile Editor and Happy Hour Deals */}
              <RestaurantDealsSection restaurantId={restaurant.id} restaurant={restaurantWithIds} />
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Events Feed */}
        <RestaurantEventsFeed restaurantId={restaurant.id} />
      </div>
    </div>
  );
};

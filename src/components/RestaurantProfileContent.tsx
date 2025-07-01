
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RestaurantBasicInfo } from '@/components/RestaurantBasicInfo';
import { RestaurantContactInfo } from '@/components/RestaurantContactInfo';
import { RestaurantHappyHours } from '@/components/RestaurantHappyHours';
import { RestaurantDealsSection } from '@/components/RestaurantDealsSection';
import { RestaurantEventsFeed } from '@/components/RestaurantEventsFeed';
import { RestaurantProfileEditor } from '@/components/RestaurantProfileEditor';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  street_address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  website?: string | null;
  merchant_happy_hour: Array<{
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
}

interface RestaurantProfileContentProps {
  restaurant: Restaurant;
}

export const RestaurantProfileContent: React.FC<RestaurantProfileContentProps> = ({ restaurant }) => {
  // Transform the merchant_happy_hour data to include IDs for the editor
  const restaurantWithIds = {
    ...restaurant,
    merchant_happy_hour: restaurant.merchant_happy_hour.map(hh => ({
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
            {/* Header with Restaurant Name, Logo and Edit Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                {/* Logo Placeholder */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-xs font-medium">LOGO</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
              </div>
              <RestaurantProfileEditor restaurant={restaurantWithIds} />
            </div>

            {/* Two Column Layout with adjusted widths */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Narrower */}
              <div className="lg:col-span-1 space-y-6">
                <RestaurantContactInfo
                  streetAddress={restaurant.street_address}
                  streetAddressLine2={restaurant.street_address_line_2}
                  city={restaurant.city}
                  state={restaurant.state}
                  zipCode={restaurant.zip_code}
                  phoneNumber={restaurant.phone_number}
                  website={restaurant.website}
                />

                <RestaurantHappyHours happyHours={restaurant.merchant_happy_hour || []} />
              </div>

              {/* Right Column - Wider for Happy Hour Deals */}
              <div className="lg:col-span-2">
                <RestaurantDealsSection restaurantId={restaurant.id} restaurant={restaurantWithIds} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Events Feed */}
        <RestaurantEventsFeed restaurantId={restaurant.id} />
      </div>
    </div>
  );
};

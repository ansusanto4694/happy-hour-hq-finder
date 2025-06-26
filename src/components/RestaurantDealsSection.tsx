
import React from 'react';
import { HappyHourDealsManager } from '@/components/HappyHourDealsManager';
import { HappyHourDealsDisplay } from '@/components/HappyHourDealsDisplay';
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
  restaurant_happy_hour: Array<{
    id: string;
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
}

interface RestaurantDealsSectionProps {
  restaurantId: number;
  restaurant: Restaurant;
}

export const RestaurantDealsSection: React.FC<RestaurantDealsSectionProps> = ({ restaurantId, restaurant }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Restaurant Profile</h2>
        <div className="flex gap-2">
          <RestaurantProfileEditor restaurant={restaurant} />
          <HappyHourDealsManager restaurantId={restaurantId} />
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-medium text-gray-800 mb-2">Happy Hour Deals</h3>
        <HappyHourDealsDisplay restaurantId={restaurantId} />
      </div>
    </div>
  );
};

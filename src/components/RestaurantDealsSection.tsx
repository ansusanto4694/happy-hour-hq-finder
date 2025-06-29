
import React from 'react';
import { HappyHourDealsManager } from '@/components/HappyHourDealsManager';
import { HappyHourDealsDisplay } from '@/components/HappyHourDealsDisplay';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  street_address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  merchant_happy_hour: Array<{
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Happy Hour Menu</h3>
        <HappyHourDealsManager restaurantId={restaurantId} />
      </div>
      
      <div>
        <HappyHourDealsDisplay restaurantId={restaurantId} />
      </div>
    </div>
  );
};

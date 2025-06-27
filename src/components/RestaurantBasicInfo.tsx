
import React from 'react';

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

interface RestaurantBasicInfoProps {
  restaurantName: string;
  restaurant?: Restaurant;
}

export const RestaurantBasicInfo: React.FC<RestaurantBasicInfoProps> = ({ 
  restaurantName, 
  restaurant 
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{restaurantName}</h1>
      {restaurant && (
        <div className="flex items-center">
          {/* The RestaurantProfileEditor will be rendered here */}
        </div>
      )}
    </div>
  );
};

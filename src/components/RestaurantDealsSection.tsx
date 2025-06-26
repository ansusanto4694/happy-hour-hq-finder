
import React from 'react';
import { HappyHourDealsManager } from '@/components/HappyHourDealsManager';
import { HappyHourDealsDisplay } from '@/components/HappyHourDealsDisplay';

interface RestaurantDealsSectionProps {
  restaurantId: number;
}

export const RestaurantDealsSection: React.FC<RestaurantDealsSectionProps> = ({ restaurantId }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Happy Hour Deals</h2>
        <HappyHourDealsManager restaurantId={restaurantId} />
      </div>
      <HappyHourDealsDisplay restaurantId={restaurantId} />
    </div>
  );
};


import React from 'react';

interface RestaurantBasicInfoProps {
  restaurantName: string;
}

export const RestaurantBasicInfo: React.FC<RestaurantBasicInfoProps> = ({ restaurantName }) => {
  return (
    <div className="flex items-center space-x-6 mb-8">
      <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500">Logo</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {restaurantName}
        </h1>
      </div>
    </div>
  );
};


import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodaysHappyHour } from '@/utils/timeUtils';

interface SearchResultCardProps {
  restaurant: any;
  onClick: (restaurantId: number) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ 
  restaurant, 
  onClick 
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(restaurant.id)}
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
  );
};

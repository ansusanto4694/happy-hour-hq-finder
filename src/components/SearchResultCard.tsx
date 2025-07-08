
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodaysHappyHour } from '@/utils/timeUtils';

interface SearchResultCardProps {
  restaurant: any;
  onClick: (restaurantId: number) => void;
  isMobile?: boolean;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ 
  restaurant, 
  onClick,
  isMobile = false
}) => {
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(restaurant.id)}
    >
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-2">
          {/* Restaurant name and happy hour badge */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm sm:text-xl font-semibold text-gray-900 break-words leading-tight sm:leading-normal">
              {restaurant.restaurant_name}
            </h3>
            <Badge 
              variant="secondary" 
              className="flex-shrink-0 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1 font-medium"
            >
              {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
            </Badge>
          </div>
          
          {/* Address */}
          <div className="text-xs sm:text-base text-gray-600 leading-snug sm:leading-normal sm:mt-2">
            <p className="break-words">
              {restaurant.street_address}
              {restaurant.street_address_line_2 && `, ${restaurant.street_address_line_2}`}
            </p>
            <p>
              {restaurant.city}, {restaurant.state} {restaurant.zip_code}
            </p>
          </div>
          
          {/* Phone and Categories in same row */}
          <div className="flex items-center justify-between gap-2 sm:mt-1">
            {restaurant.phone_number && (
              <p className="text-xs sm:text-base text-gray-500 sm:text-gray-600 font-medium sm:font-normal">
                {restaurant.phone_number}
              </p>
            )}
            
            {/* Category tags - limit to 2 on mobile */}
            {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end sm:justify-start sm:mt-2">
                {(isMobile ? restaurant.merchant_categories.slice(0, 2) : restaurant.merchant_categories).map((merchantCategory: any) => (
                  <Badge 
                    key={merchantCategory.id} 
                    variant="outline" 
                    className="text-xs sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 font-normal"
                  >
                    {merchantCategory.categories.name}
                  </Badge>
                ))}
                {restaurant.merchant_categories.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 font-normal text-gray-500 sm:hidden"
                  >
                    +{restaurant.merchant_categories.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

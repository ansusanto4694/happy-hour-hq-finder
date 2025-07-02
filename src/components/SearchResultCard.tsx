
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
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Logo placeholder */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Logo</span>
            </div>
          </div>
          
          {/* Restaurant details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-gray-900 break-words">
                  {restaurant.restaurant_name}
                </h3>
                <p className="text-gray-600 text-base mt-2 break-words">
                  {restaurant.street_address}
                  {restaurant.street_address_line_2 && `, ${restaurant.street_address_line_2}`}
                </p>
                <p className="text-gray-600 text-base">
                  {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                </p>
                {restaurant.phone_number && (
                  <p className="text-gray-600 text-base mt-1">
                    {restaurant.phone_number}
                  </p>
                )}
                
                {/* Category tags */}
                {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {restaurant.merchant_categories.map((merchantCategory: any) => (
                      <Badge 
                        key={merchantCategory.id} 
                        variant="outline" 
                        className="text-xs px-2 py-1"
                      >
                        {merchantCategory.categories.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <Badge variant="secondary" className="flex-shrink-0 text-sm px-3 py-1">
                {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

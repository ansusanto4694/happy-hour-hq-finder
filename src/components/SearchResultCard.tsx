
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
        {isMobile ? (
          // Mobile Layout - Compact, no logo
          <div className="space-y-2">
            {/* Restaurant name and happy hour badge */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900 break-words leading-tight">
                {restaurant.restaurant_name}
              </h3>
              <Badge 
                variant="secondary" 
                className="flex-shrink-0 text-sm px-2 py-1 font-medium"
              >
                {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
              </Badge>
            </div>
            
            {/* Address */}
            <div className="text-sm text-gray-600 leading-snug">
              <p className="break-words">
                {restaurant.street_address}
                {restaurant.street_address_line_2 && `, ${restaurant.street_address_line_2}`}
              </p>
              <p>
                {restaurant.city}, {restaurant.state} {restaurant.zip_code}
              </p>
            </div>
            
            {/* Phone and Categories in same row */}
            <div className="flex items-center justify-between gap-2">
              {restaurant.phone_number && (
                <p className="text-sm text-gray-500 font-medium">
                  {restaurant.phone_number}
                </p>
              )}
              
              {/* Category tags - limit to 2 on mobile */}
              {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end">
                  {restaurant.merchant_categories.slice(0, 2).map((merchantCategory: any) => (
                    <Badge 
                      key={merchantCategory.id} 
                      variant="outline" 
                      className="text-sm px-2 py-1 font-normal"
                    >
                      {merchantCategory.categories.name}
                    </Badge>
                  ))}
                  {restaurant.merchant_categories.length > 2 && (
                    <Badge 
                      variant="outline" 
                      className="text-sm px-2 py-1 font-normal text-gray-500"
                    >
                      +{restaurant.merchant_categories.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop Layout - Original design with logo
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
                  <h3 className="text-2xl font-semibold text-gray-900 break-words">
                    {restaurant.restaurant_name}
                  </h3>
                  <p className="text-gray-600 text-lg mt-2 break-words">
                    {restaurant.street_address}
                    {restaurant.street_address_line_2 && `, ${restaurant.street_address_line_2}`}
                  </p>
                  <p className="text-gray-600 text-lg">
                    {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                  </p>
                  {restaurant.phone_number && (
                    <p className="text-gray-600 text-lg mt-1">
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
                          className="text-sm px-2 py-1"
                        >
                          {merchantCategory.categories.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <Badge variant="secondary" className="flex-shrink-0 text-base px-3 py-1">
                  {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

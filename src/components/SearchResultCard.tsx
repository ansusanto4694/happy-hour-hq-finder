
import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodaysHappyHour } from '@/utils/timeUtils';

interface SearchResultCardProps {
  restaurant: any;
  onClick: (restaurantId: number) => void;
  isMobile?: boolean;
}

const SearchResultCard: React.FC<SearchResultCardProps> = memo(({ 
  restaurant, 
  onClick,
  isMobile = false
}) => {
  // Memoize expensive calculations
  const happyHourText = useMemo(() => 
    getTodaysHappyHour(restaurant.merchant_happy_hour || []), 
    [restaurant.merchant_happy_hour]
  );

  const address = useMemo(() => ({
    line1: restaurant.street_address + (restaurant.street_address_line_2 ? `, ${restaurant.street_address_line_2}` : ''),
    line2: `${restaurant.city}, ${restaurant.state} ${restaurant.zip_code}`
  }), [restaurant.street_address, restaurant.street_address_line_2, restaurant.city, restaurant.state, restaurant.zip_code]);

  const categories = useMemo(() => 
    restaurant.merchant_categories || [], 
    [restaurant.merchant_categories]
  );

  // Memoize click handler
  const handleClick = useCallback(() => {
    onClick(restaurant.id);
  }, [onClick, restaurant.id]);
  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-3 sm:p-6">
        {isMobile ? (
          // Mobile Layout - Compact with small logo
          <div className="flex items-start space-x-3">
            {/* Small logo for mobile */}
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-xs">Logo</span>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Restaurant name and happy hour badge */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900 break-words leading-tight">
                  {restaurant.restaurant_name}
                </h3>
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 text-xs px-2 py-1 font-medium"
                >
                  {happyHourText}
                </Badge>
              </div>
              
              {/* Address */}
              <div className="text-xs text-gray-600 leading-snug">
                <p className="break-words">
                  {address.line1}
                </p>
                <p>
                  {address.line2}
                </p>
              </div>
              
              {/* Phone and Categories in same row */}
              <div className="flex items-center justify-between gap-2">
                {restaurant.phone_number && (
                  <p className="text-xs text-gray-500 font-medium">
                    {restaurant.phone_number}
                  </p>
                )}
                
                {/* Category tags - limit to 2 on mobile */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    {categories.slice(0, 2).map((merchantCategory: any) => (
                      <Badge 
                        key={merchantCategory.id} 
                        variant="outline" 
                        className="text-xs px-2 py-1 font-normal"
                      >
                        {merchantCategory.categories.name}
                      </Badge>
                    ))}
                    {categories.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-1 font-normal text-gray-500"
                      >
                        +{categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Desktop Layout - Original design with logo
          <div className="flex items-start space-x-4">
            {/* Logo placeholder */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-xs">Logo</span>
                )}
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
                    {address.line1}
                  </p>
                  <p className="text-gray-600 text-base">
                    {address.line2}
                  </p>
                  {restaurant.phone_number && (
                    <p className="text-gray-600 text-base mt-1">
                      {restaurant.phone_number}
                    </p>
                  )}
                  
                  {/* Category tags */}
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {categories.map((merchantCategory: any) => (
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
                  {happyHourText}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SearchResultCard.displayName = 'SearchResultCard';

export { SearchResultCard };

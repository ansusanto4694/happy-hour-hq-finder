
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
  // Check if merchant has active offers that haven't expired
  const now = new Date();
  const hasActiveOffers = restaurant.merchant_offers && 
    restaurant.merchant_offers.some((offer: any) => {
      const endTime = new Date(offer.end_time || '');
      return offer.is_active && endTime > now;
    });

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(restaurant.id)}
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
            
            <div className="flex-1 min-w-0">
              {/* Restaurant name */}
              <h3 className="text-base font-semibold text-gray-900 break-words leading-tight mb-1">
                {restaurant.restaurant_name}
              </h3>
              
              {/* Address directly under name */}
              <div className="text-xs text-gray-600 leading-snug mb-2">
                <p className="break-words">
                  {restaurant.street_address}
                  {restaurant.street_address_line_2 && `, ${restaurant.street_address_line_2}`}
                </p>
                <p>
                  {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                </p>
              </div>
              
              {/* Badges row */}
              <div className="flex flex-wrap gap-1 mb-2">
                {hasActiveOffers && (
                  <Badge 
                    variant="default" 
                    className="text-[10px] px-1.5 py-0.5 font-medium bg-green-600 hover:bg-green-700"
                  >
                    Offer Available
                  </Badge>
                )}
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0.5 font-medium"
                >
                  {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
                </Badge>
              </div>
              
              {/* Phone and Categories in same row */}
              <div className="flex items-center justify-between gap-2">
                {restaurant.phone_number && (
                  <p className="text-xs text-gray-500 font-medium">
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
                        className="text-xs px-2 py-1 font-normal"
                      >
                        {merchantCategory.categories.name}
                      </Badge>
                    ))}
                    {restaurant.merchant_categories.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-1 font-normal text-gray-500"
                      >
                        +{restaurant.merchant_categories.length - 2}
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
                
                <div className="flex flex-col gap-2">
                  {hasActiveOffers && (
                    <Badge 
                      variant="default" 
                      className="flex-shrink-0 text-sm px-3 py-1 bg-green-600 hover:bg-green-700"
                    >
                      Offer Available
                    </Badge>
                  )}
                  <Badge variant="secondary" className="flex-shrink-0 text-sm px-3 py-1">
                    {getTodaysHappyHour(restaurant.merchant_happy_hour || [])}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

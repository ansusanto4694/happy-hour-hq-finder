import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface MerchantMapPreviewCardProps {
  restaurant: Restaurant;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const MerchantMapPreviewCard: React.FC<MerchantMapPreviewCardProps> = ({
  restaurant,
  position,
  isVisible,
}) => {
  console.log('MerchantMapPreviewCard props:', { restaurant: restaurant?.restaurant_name, position, isVisible });
  
  if (!isVisible) return null;

  return (
    <Card 
      className="absolute z-50 shadow-lg border bg-white min-w-[200px] animate-scale-in"
      style={{ 
        left: position.x + 10, 
        top: position.y - 60,
        pointerEvents: 'none' // Prevent card from interfering with hover
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Placeholder for merchant logo - you can replace with actual logo when available */}
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-orange-600 font-semibold text-sm">
              {restaurant.restaurant_name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {restaurant.restaurant_name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {restaurant.city}, {restaurant.state}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
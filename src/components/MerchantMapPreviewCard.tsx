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
  isMobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
}

export const MerchantMapPreviewCard: React.FC<MerchantMapPreviewCardProps> = ({
  restaurant,
  position,
  isVisible,
  isMobile = false,
  onNavigate,
  onClose,
}) => {
  console.log('MerchantMapPreviewCard props:', { restaurant: restaurant?.restaurant_name, position, isVisible });
  
  if (!isVisible) return null;

  if (isMobile) {
    // Mobile: Fixed position at bottom with click handlers
    return (
      <Card 
        className="fixed bottom-0 left-0 right-0 z-50 shadow-lg border bg-white animate-slide-up rounded-t-lg"
        style={{ 
          pointerEvents: 'auto'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {/* Placeholder for merchant logo */}
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-semibold text-lg">
                  {restaurant.restaurant_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">
                  {restaurant.restaurant_name}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {restaurant.street_address}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {restaurant.city}, {restaurant.state}
                </p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="ml-2 p-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          {onNavigate && (
            <button 
              onClick={onNavigate}
              className="mt-3 w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
            >
              View Restaurant
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Desktop: Hover positioning
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
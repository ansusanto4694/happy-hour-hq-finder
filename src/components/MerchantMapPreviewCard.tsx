import React from 'react';
import { Link } from 'react-router-dom';
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
  logo_url?: string | null;
  slug?: string | null;
}

interface MerchantMapPreviewCardProps {
  restaurant: Restaurant | null;
  position: { x: number; y: number };
  isVisible: boolean;
  isMobile?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const MerchantMapPreviewCard: React.FC<MerchantMapPreviewCardProps> = ({
  restaurant,
  position,
  isVisible,
  isMobile = false,
  onNavigate,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!isVisible || !restaurant) return null;

  const merchantUrl = `/restaurant/${restaurant.slug || restaurant.id}`;

  if (isMobile) {
    // Mobile: Fixed position at bottom with click handlers
    return (
      <Card 
        className="fixed left-4 right-4 z-50 shadow-lg border bg-white animate-slide-up rounded-lg overflow-hidden"
        style={{ 
          bottom: 'calc(64px + 12.5vh + 16px)',
          pointerEvents: 'auto'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Merchant logo */}
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.restaurant_name} logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-orange-600 font-semibold text-lg">
                  {restaurant.restaurant_name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
                {restaurant.restaurant_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {restaurant.street_address}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {restaurant.city}, {restaurant.state}
              </p>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0 -mt-1 -mr-1"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
          <Link 
            to={merchantUrl}
            onClick={onNavigate}
            className="mt-3 w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors block text-center"
          >
            View Restaurant
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Desktop: Hover positioning - make entire card a link
  return (
    <Link 
      to={merchantUrl}
      className="absolute z-50 block"
      style={{ 
        left: position.x + 10, 
        top: position.y - 60,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card 
        className="shadow-lg border bg-white min-w-[200px] animate-scale-in hover:shadow-xl transition-shadow cursor-pointer"
      >
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {/* Merchant logo */}
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.restaurant_name} logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-orange-600 font-semibold text-sm">
                  {restaurant.restaurant_name.charAt(0)}
                </span>
              )}
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
    </Link>
  );
};
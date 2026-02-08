import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMenuTypeBadge, getAllTodaysHappyHours } from '@/utils/timeUtils';

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
  neighborhood?: string | null;
  merchant_happy_hour?: any[];
  happy_hour_deals?: any[];
  merchant_categories?: any[];
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
  // Hooks must be called before any early returns
  const todaysHappyHours = useMemo(
    () => getAllTodaysHappyHours(restaurant?.merchant_happy_hour || []),
    [restaurant?.merchant_happy_hour]
  );

  const menuTypeBadge = useMemo(
    () => getMenuTypeBadge(restaurant?.happy_hour_deals || []),
    [restaurant?.happy_hour_deals]
  );

  if (!isVisible || !restaurant) return null;

  const merchantUrl = `/restaurant/${restaurant.slug || restaurant.id}`;
  const categories = restaurant.merchant_categories || [];

  if (isMobile) {
    const hasDealInfo = menuTypeBadge || todaysHappyHours.length > 0;

    return (
      <Card 
        className="fixed left-4 right-4 z-50 shadow-lg border bg-card animate-slide-up rounded-lg overflow-hidden"
        style={{ 
          bottom: 'calc(64px + 12.5vh + 16px)',
          pointerEvents: 'auto'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Merchant logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.restaurant_name} logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-primary font-semibold text-lg">
                  {restaurant.restaurant_name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Line 1: Merchant Name */}
              <h3 className="font-bold text-foreground text-base leading-tight truncate">
                {restaurant.restaurant_name}
              </h3>
              
              {/* Line 2: Deal type + Happy hour time badges */}
              <div className="flex flex-wrap gap-1.5">
                {menuTypeBadge && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-0.5 font-semibold ${
                      menuTypeBadge.type === 'food_and_drinks' 
                        ? 'bg-teal-500/90 text-white' 
                        : 'bg-purple-500/90 text-white'
                    }`}
                  >
                    {menuTypeBadge.label}
                  </Badge>
                )}
                {todaysHappyHours.length > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 font-semibold bg-amber-500/90 text-white"
                  >
                    {todaysHappyHours[0].start} - {todaysHappyHours[0].end}
                    {todaysHappyHours.length > 1 && ` +${todaysHappyHours.length - 1}`}
                  </Badge>
                )}
                {!hasDealInfo && (
                  <span className="text-sm text-muted-foreground">
                    {restaurant.neighborhood || restaurant.city}
                  </span>
                )}
              </div>

              {/* Line 3: Category tags */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {categories.slice(0, 2).map((mc: any) => (
                    <Badge 
                      key={mc.id} 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-medium border-primary/20 text-muted-foreground bg-background/50"
                    >
                      {mc.categories?.name || mc.name}
                    </Badge>
                  ))}
                  {categories.length > 2 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-0.5 font-medium text-muted-foreground border-muted-foreground/20 bg-background/50"
                    >
                      +{categories.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 -mt-1 -mr-1"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
          <Link 
            to={merchantUrl}
            onClick={onNavigate}
            className="mt-3 w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors block text-center font-medium"
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
        className="shadow-lg border bg-card min-w-[200px] animate-scale-in hover:shadow-xl transition-shadow cursor-pointer"
      >
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {/* Merchant logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
              {restaurant.logo_url ? (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.restaurant_name} logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-primary font-semibold text-sm">
                  {restaurant.restaurant_name.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                {restaurant.restaurant_name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {restaurant.city}, {restaurant.state}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

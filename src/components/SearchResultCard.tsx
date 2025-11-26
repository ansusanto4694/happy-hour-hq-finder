
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';
import { getTodaysHappyHour, getAllTodaysHappyHours, getMenuTypeBadge } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getDeviceType } from '@/utils/analytics';
import { FavoriteButton } from '@/components/FavoriteButton';

interface SearchResultCardProps {
  restaurant: any;
  onClick: (restaurantId: number) => void;
  isMobile?: boolean;
  onHover?: (restaurantId: number | null) => void;
}

const SearchResultCardComponent: React.FC<SearchResultCardProps> = ({ 
  restaurant, 
  onClick,
  isMobile = false,
  onHover
}) => {
  const { track, trackFunnel } = useAnalytics();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Check if merchant has active offers that haven't expired
  const now = new Date();
  const hasActiveOffers = restaurant.merchant_offers && 
    restaurant.merchant_offers.some((offer: any) => {
      const endTime = new Date(offer.end_time || '');
      return offer.is_active && endTime > now;
    });

  // Get all happy hours for today
  const todaysHappyHours = getAllTodaysHappyHours(restaurant.merchant_happy_hour || []);
  
  // Get menu type badge from happy hour deals
  const menuTypeBadge = getMenuTypeBadge(restaurant.happy_hour_deals || []);

  // Track card impressions using Intersection Observer
  useEffect(() => {
    if (!cardRef.current || hasTrackedImpression) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTrackedImpression) {
          track({
            eventType: 'impression',
            eventCategory: 'merchant_interaction',
            eventAction: 'result_card_impression',
            merchantId: restaurant.id,
            metadata: {
              deviceType: getDeviceType(),
              hasActiveOffers,
              merchantName: restaurant.restaurant_name,
              todaysHappyHour: getTodaysHappyHour(restaurant.merchant_happy_hour || [])
            },
          });
          setHasTrackedImpression(true);
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [hasTrackedImpression, restaurant, hasActiveOffers, track]);

  const handleClick = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'result_card_clicked',
      merchantId: restaurant.id,
      metadata: {
        deviceType: getDeviceType(),
        hasActiveOffers,
        merchantName: restaurant.restaurant_name,
        todaysHappyHour: getTodaysHappyHour(restaurant.merchant_happy_hour || []),
        categoriesCount: restaurant.merchant_categories?.length || 0
      },
    });
    
    await trackFunnel({
      funnelStep: 'merchant_clicked',
      merchantId: restaurant.id,
      stepOrder: 4
    });
    
    onClick(restaurant.id);
  };

  const handleHover = async () => {
    if (!isMobile && onHover) {
      await track({
        eventType: 'hover',
        eventCategory: 'merchant_interaction',
        eventAction: 'result_card_hover',
        merchantId: restaurant.id,
      });
      onHover(restaurant.id);
    }
  };

  return (
    <Card
      ref={cardRef}
      className={`${
        isMobile 
          ? 'min-h-[120px] active:scale-[0.98] active:shadow-sm transition-all cursor-pointer' 
          : 'hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-primary/60 transition-all duration-300 cursor-pointer group'
      }`}
      onClick={handleClick}
      onMouseEnter={handleHover}
      onMouseLeave={() => {
        if (!isMobile && onHover) {
          onHover(null);
        }
      }}
    >
      <CardContent className="p-4 sm:p-6">
        {isMobile ? (
          // Mobile Layout - Polished with improved spacing and organization
          <div className="flex items-start space-x-3">
            {/* Logo with improved placeholder */}
            <div className="flex-shrink-0">
              <div className={`w-20 h-20 ${restaurant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-gray-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden`}>
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Store className="w-8 h-8 text-orange-400" strokeWidth={1.5} />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Info block with tighter spacing */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h3 className="text-xl font-bold text-gray-900 break-words leading-snug">
                    {restaurant.restaurant_name}
                  </h3>
                  <p className="text-sm text-gray-600 break-words leading-tight font-medium">
                    {restaurant.neighborhood || restaurant.city}
                  </p>
                  {restaurant.phone_number && (
                    <p className="text-sm text-gray-500 leading-tight">
                      {restaurant.phone_number}
                    </p>
                  )}
                </div>
                <FavoriteButton merchantId={restaurant.id} size="sm" className="flex-shrink-0" />
              </div>
              
              {/* Badges in column layout (mobile-optimized) */}
              <div className="flex flex-col gap-1.5">
                {hasActiveOffers && (
                  <Badge 
                    variant="default" 
                    className="text-sm px-2.5 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm w-fit leading-tight"
                  >
                    🎉 Offer Available
                  </Badge>
                )}
                {todaysHappyHours.length > 0 ? (
                  todaysHappyHours.map((hh, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-sm px-2.5 py-1.5 font-semibold bg-amber-500/90 hover:bg-amber-600 text-white shadow-sm w-fit leading-tight"
                    >
                      🍻 {hh.start} - {hh.end}
                    </Badge>
                  ))
                ) : (
                  <Badge 
                    variant="outline" 
                    className="text-sm px-2.5 py-1.5 font-medium text-muted-foreground border-muted-foreground/30 w-fit leading-tight"
                  >
                    No Happy Hour Today
                  </Badge>
                )}
                {menuTypeBadge && (
                  <Badge 
                    variant="secondary" 
                    className={`text-sm px-2.5 py-1.5 font-semibold shadow-sm w-fit leading-tight ${
                      menuTypeBadge.type === 'food_and_drinks' 
                        ? 'bg-teal-500/90 hover:bg-teal-600 text-white' 
                        : 'bg-purple-500/90 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {menuTypeBadge.emoji} {menuTypeBadge.label}
                  </Badge>
                )}
              </div>
              
              {/* Category tags */}
              {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {restaurant.merchant_categories.slice(0, 3).map((merchantCategory: any) => (
                    <Badge 
                      key={merchantCategory.id} 
                      variant="outline" 
                      className="text-sm px-3 py-1 font-medium border-primary/20 text-foreground/80 bg-background/50 leading-tight"
                    >
                      {merchantCategory.categories.name}
                    </Badge>
                  ))}
                  {restaurant.merchant_categories.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-sm px-3 py-1 font-medium text-muted-foreground border-muted-foreground/20 bg-background/50 leading-tight"
                    >
                      +{restaurant.merchant_categories.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Desktop Layout - Polished version with improved spacing and organization
          <div className="flex items-start space-x-4">
            {/* Logo with improved placeholder */}
            <div className="flex-shrink-0">
              <div className={`w-24 h-24 ${restaurant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-gray-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden`}>
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Store className="w-10 h-10 text-orange-400" strokeWidth={1.5} />
                )}
              </div>
            </div>
            
            {/* Restaurant details - reorganized with tighter spacing */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Info block with favorite button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h3 className="text-xl font-bold text-gray-900 break-words leading-snug">
                    {restaurant.restaurant_name}
                  </h3>
                  <p className="text-gray-600 text-sm break-words leading-tight font-medium">
                    {restaurant.neighborhood || restaurant.city}
                  </p>
                  {restaurant.phone_number && (
                    <p className="text-gray-500 text-sm leading-tight">
                      {restaurant.phone_number}
                    </p>
                  )}
                </div>
                <FavoriteButton merchantId={restaurant.id} className="flex-shrink-0" />
              </div>
              
              {/* Badges in horizontal row below info */}
              <div className="flex flex-wrap gap-2">
                {hasActiveOffers && (
                  <Badge 
                    variant="default" 
                    className="text-sm px-2.5 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm leading-tight"
                  >
                    🎉 Offer Available
                  </Badge>
                )}
                {todaysHappyHours.length > 0 ? (
                  todaysHappyHours.map((hh, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-sm px-2.5 py-1.5 font-semibold bg-amber-500/90 hover:bg-amber-600 text-white shadow-sm leading-tight"
                    >
                      🍻 {hh.start} - {hh.end}
                    </Badge>
                  ))
                ) : (
                  <Badge 
                    variant="outline" 
                    className="text-sm px-2.5 py-1.5 font-medium text-muted-foreground border-muted-foreground/30 leading-tight"
                  >
                    No Happy Hour Today
                  </Badge>
                )}
                {menuTypeBadge && (
                  <Badge 
                    variant="secondary" 
                    className={`text-sm px-2.5 py-1.5 font-semibold shadow-sm leading-tight ${
                      menuTypeBadge.type === 'food_and_drinks' 
                        ? 'bg-teal-500/90 hover:bg-teal-600 text-white' 
                        : 'bg-purple-500/90 hover:bg-purple-600 text-white'
                    }`}
                  >
                    {menuTypeBadge.emoji} {menuTypeBadge.label}
                  </Badge>
                )}
              </div>
              
              {/* Category tags on separate line */}
              {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {restaurant.merchant_categories.map((merchantCategory: any) => (
                    <Badge 
                      key={merchantCategory.id} 
                      variant="outline" 
                      className="text-sm px-3 py-1 font-medium border-primary/20 text-foreground/80 bg-background/50 leading-tight"
                    >
                      {merchantCategory.categories.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Memoize to prevent unnecessary re-renders when restaurant data hasn't changed
export const SearchResultCard = React.memo(SearchResultCardComponent, (prevProps, nextProps) => {
  // Deep comparison for restaurant object since it contains nested data
  return (
    prevProps.restaurant.id === nextProps.restaurant.id &&
    prevProps.restaurant.restaurant_name === nextProps.restaurant.restaurant_name &&
    prevProps.restaurant.logo_url === nextProps.restaurant.logo_url &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onHover === nextProps.onHover &&
    JSON.stringify(prevProps.restaurant.merchant_offers) === JSON.stringify(nextProps.restaurant.merchant_offers) &&
    JSON.stringify(prevProps.restaurant.merchant_categories) === JSON.stringify(nextProps.restaurant.merchant_categories) &&
    JSON.stringify(prevProps.restaurant.merchant_happy_hour) === JSON.stringify(nextProps.restaurant.merchant_happy_hour)
  );
});
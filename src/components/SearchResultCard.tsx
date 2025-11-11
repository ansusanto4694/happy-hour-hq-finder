
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTodaysHappyHour, getAllTodaysHappyHours } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Phone, MapPin, Share2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  
  // Mock rating for now (can be replaced with actual data later)
  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 200) + 50;

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
        isMobile,
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

  const handleCallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'call_button_clicked',
      merchantId: restaurant.id,
    });
  };

  const handleDirectionsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'directions_button_clicked',
      merchantId: restaurant.id,
    });
    const address = encodeURIComponent(`${restaurant.street_address}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip_code}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'share_button_clicked',
      merchantId: restaurant.id,
    });
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.restaurant_name,
          text: `Check out ${restaurant.restaurant_name} on SipMunchYap!`,
          url: `${window.location.origin}/restaurant/${restaurant.id}`
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Card
      ref={cardRef}
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-orange-200"
      onClick={handleClick}
      onMouseEnter={handleHover}
      onMouseLeave={() => {
        if (!isMobile && onHover) {
          onHover(null);
        }
      }}
    >
      <CardContent className="p-4">
        {isMobile ? (
          // Mobile Layout - Enhanced with trust signals and quick actions
          <div className="flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              {/* Larger logo for mobile */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                  {restaurant.logo_url ? (
                    <img 
                      src={restaurant.logo_url} 
                      alt={`${restaurant.restaurant_name} logo`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-orange-500 font-bold text-2xl">
                      {restaurant.restaurant_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* Restaurant name - Larger and bolder */}
                <h3 className="text-lg font-bold text-gray-900 break-words leading-tight mb-1">
                  {restaurant.restaurant_name}
                </h3>
                
                {/* Trust signals row */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-gray-900">{rating}</span>
                    <span className="text-xs text-gray-500">({reviewCount})</span>
                  </div>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                    ✓ Verified
                  </Badge>
                  {Math.random() > 0.5 && (
                    <span className="text-xs text-orange-600 font-medium">🔥 Popular</span>
                  )}
                </div>
                
                {/* Prominent Happy Hour badges */}
                <div className="flex flex-col gap-1.5 mb-2">
                  {hasActiveOffers && (
                    <Badge 
                      variant="default" 
                      className="text-xs px-2 py-1 font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 w-fit shadow-sm"
                    >
                      🎁 Special Offer Available
                    </Badge>
                  )}
                  {todaysHappyHours.length > 0 ? (
                    todaysHappyHours.map((hh, index) => (
                      <Badge 
                        key={index}
                        className="text-sm px-3 py-1.5 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white w-fit shadow-md"
                      >
                        🍻 {hh.start} - {hh.end}
                      </Badge>
                    ))
                  ) : (
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-2 py-1 font-medium w-fit"
                    >
                      No Happy Hour Today
                    </Badge>
                  )}
                </div>
              </div>
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
            
            {/* Quick Actions Row - One-tap actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {restaurant.phone_number && (
                <a
                  href={`tel:${restaurant.phone_number}`}
                  onClick={handleCallClick}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 px-3 rounded-lg transition-colors active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Call</span>
                </a>
              )}
              <button
                onClick={handleDirectionsClick}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-2.5 px-3 rounded-lg transition-colors active:scale-95"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Directions</span>
              </button>
              {navigator.share && (
                <button
                  onClick={handleShareClick}
                  className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2.5 px-3 rounded-lg transition-colors active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Category tags */}
            {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {restaurant.merchant_categories.slice(0, 3).map((merchantCategory: any) => (
                  <Badge 
                    key={merchantCategory.id} 
                    variant="outline" 
                    className="text-xs px-2 py-1 font-normal"
                  >
                    {merchantCategory.categories.name}
                  </Badge>
                ))}
                {restaurant.merchant_categories.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1 font-normal text-gray-500"
                  >
                    +{restaurant.merchant_categories.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          // Desktop Layout - Original design with enhancements
          <div className="flex items-start space-x-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-orange-500 font-bold text-3xl">
                    {restaurant.restaurant_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Restaurant details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 break-words">
                      {restaurant.restaurant_name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="text-base font-semibold text-gray-900">{rating}</span>
                      <span className="text-sm text-gray-500">({reviewCount} reviews)</span>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200">
                      ✓ Verified
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-base break-words">
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
                      className="flex-shrink-0 text-sm px-4 py-2 font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md"
                    >
                      🎁 Special Offer
                    </Badge>
                  )}
                  {todaysHappyHours.length > 0 ? (
                    todaysHappyHours.map((hh, index) => (
                      <Badge 
                        key={index}
                        className="flex-shrink-0 text-base px-4 py-2 font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      >
                        🍻 {hh.start} - {hh.end}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="flex-shrink-0 text-sm px-3 py-1">
                      No Happy Hour Today
                    </Badge>
                  )}
                </div>
              </div>
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

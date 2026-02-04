
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Star } from 'lucide-react';
import { getTodaysHappyHour, getAllTodaysHappyHours, getMenuTypeBadge } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getDeviceType } from '@/utils/analytics';
import { FavoriteButton } from '@/components/FavoriteButton';
import { observeElement, unobserveElement } from '@/hooks/useSharedIntersectionObserver';

interface SearchResultCardProps {
  restaurant: any;
  onClick?: (restaurantId: number, slug?: string | null) => void;
  isMobile?: boolean;
  onHover?: (restaurantId: number | null) => void;
  onNavigate?: (merchantId: number) => void;
}

const SearchResultCardComponent: React.FC<SearchResultCardProps> = ({ 
  restaurant, 
  onClick,
  isMobile = false,
  onHover,
  onNavigate
}) => {
  const { track, trackFunnel } = useAnalytics();
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  // Calculate aggregate rating from reviews - memoized to avoid recalculation
  const ratingData = useMemo(() => {
    const reviews = restaurant.merchant_reviews?.filter((r: any) => r.status === 'published') || [];
    if (reviews.length === 0) return null;
    
    let totalSum = 0;
    let totalCount = 0;
    
    reviews.forEach((review: any) => {
      review.merchant_review_ratings?.forEach((r: { rating: number }) => {
        totalSum += r.rating;
        totalCount += 1;
      });
    });
    
    if (totalCount === 0) return null;
    
    return {
      average: totalSum / totalCount,
      reviewCount: reviews.length
    };
  }, [restaurant.merchant_reviews]);

  // Check if merchant has active offers that haven't expired - memoized
  const hasActiveOffers = useMemo(() => {
    const now = new Date();
    return restaurant.merchant_offers?.some((offer: any) => {
      const endTime = new Date(offer.end_time || '');
      return offer.is_active && endTime > now;
    }) ?? false;
  }, [restaurant.merchant_offers]);

  // Get all happy hours for today - memoized
  const todaysHappyHours = useMemo(
    () => getAllTodaysHappyHours(restaurant.merchant_happy_hour || []),
    [restaurant.merchant_happy_hour]
  );
  
  // Get menu type badge from happy hour deals - memoized
  const menuTypeBadge = useMemo(
    () => getMenuTypeBadge(restaurant.happy_hour_deals || []),
    [restaurant.happy_hour_deals]
  );

  // Track card impressions using shared IntersectionObserver
  // OPTIMIZED: Single shared observer instead of one per card
  const handleImpression = useCallback(() => {
    if (!hasTrackedImpression) {
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
  }, [hasTrackedImpression, restaurant.id, restaurant.restaurant_name, restaurant.merchant_happy_hour, hasActiveOffers, track]);

  // Use shared intersection observer for efficient impression tracking
  // Fixed: cleanup now properly unregisters element on unmount
  useEffect(() => {
    const element = cardRef.current;
    if (!element || hasTrackedImpression) return;

    observeElement(element, handleImpression);

    // Cleanup on unmount - properly returns from useEffect
    return () => {
      unobserveElement(element);
    };
  }, [hasTrackedImpression, handleImpression]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow native behavior for right-click, middle-click, ctrl+click, cmd+click
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.button === 2) {
      return; // Let browser handle it natively
    }
    
    // Save merchant ID for scroll restoration before navigation
    onNavigate?.(restaurant.id);
    
    // Track analytics (don't prevent default - let link work normally)
    track({
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
    
    trackFunnel({
      funnelStep: 'merchant_clicked',
      merchantId: restaurant.id,
      stepOrder: 4
    });
    
    // Call optional onClick callback
    onClick?.(restaurant.id, restaurant.slug);
  };

  // Build the merchant URL
  const merchantUrl = `/restaurant/${restaurant.slug || restaurant.id}`;

  // Simple hover handler - analytics tracking removed for performance
  const handleHover = () => {
    if (!isMobile && onHover) {
      onHover(restaurant.id);
    }
  };

  return (
    <Link 
      to={merchantUrl}
      onClick={handleClick}
      className="block"
      draggable={false}
      onMouseEnter={handleHover}
      onMouseLeave={() => {
        if (!isMobile && onHover) {
          onHover(null);
        }
      }}
      data-merchant-id={restaurant.id}
    >
      <Card
        ref={cardRef}
        className={`${
          isMobile 
            ? 'min-h-[140px] active:scale-[0.98] active:bg-muted/50 transition-all duration-150 cursor-pointer touch-manipulation border-l-4 border-l-primary/40' 
            : 'hover:shadow-lg hover:scale-[1.02] hover:border-l-4 hover:border-l-primary/60 transition-all duration-300 cursor-pointer group'
        }`}
      >
      <CardContent className={isMobile ? "p-4" : "p-4 sm:p-6"}>
        {isMobile ? (
          // Mobile Layout - Enhanced touch targets and clear CTA
          <div className="flex items-start gap-3">
            {/* Logo with improved placeholder */}
            <div className="flex-shrink-0">
              <div className={`w-20 h-20 ${restaurant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg shadow-sm flex items-center justify-center overflow-hidden`}>
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                ) : (
                  <Store className="w-8 h-8 text-orange-400" strokeWidth={1.5} />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header with name and favorite */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground break-words leading-tight line-clamp-2">
                    {restaurant.restaurant_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-muted-foreground break-words leading-tight font-medium">
                      {restaurant.neighborhood || restaurant.city}
                    </p>
                    {ratingData && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{ratingData.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <FavoriteButton 
                  merchantId={restaurant.id} 
                  size="sm" 
                  className="flex-shrink-0 -mt-1 -mr-1 p-2" 
                />
              </div>
              
              {/* Compact badges row */}
              <div className="flex flex-wrap gap-1.5">
                {hasActiveOffers && (
                  <Badge 
                    variant="default" 
                    className="text-xs px-2 py-1 font-semibold bg-emerald-600 text-white shadow-sm"
                  >
                    🎉 Offer
                  </Badge>
                )}
                {todaysHappyHours.length > 0 ? (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-1 font-semibold bg-amber-500/90 text-white shadow-sm"
                  >
                    🍻 {todaysHappyHours[0].start} - {todaysHappyHours[0].end}
                    {todaysHappyHours.length > 1 && ` +${todaysHappyHours.length - 1}`}
                  </Badge>
                ) : (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-2 py-1 font-medium text-muted-foreground border-muted-foreground/30"
                  >
                    No HH Today
                  </Badge>
                )}
                {menuTypeBadge && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-1 font-semibold shadow-sm ${
                      menuTypeBadge.type === 'food_and_drinks' 
                        ? 'bg-teal-500/90 text-white' 
                        : 'bg-purple-500/90 text-white'
                    }`}
                  >
                    {menuTypeBadge.emoji} {menuTypeBadge.label}
                  </Badge>
                )}
              </div>
              
              {/* Clear CTA indicator */}
              <div className="flex items-center justify-between pt-1">
                {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {restaurant.merchant_categories.slice(0, 2).map((merchantCategory: any) => (
                      <Badge 
                        key={merchantCategory.id} 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 font-medium border-primary/20 text-muted-foreground bg-background/50"
                      >
                        {merchantCategory.categories.name}
                      </Badge>
                    ))}
                    {restaurant.merchant_categories.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs px-2 py-0.5 font-medium text-muted-foreground border-muted-foreground/20 bg-background/50"
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
                    width={96}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
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
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-sm break-words leading-tight font-medium">
                      {restaurant.neighborhood || restaurant.city}
                    </p>
                    {ratingData && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">{ratingData.average.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({ratingData.reviewCount})</span>
                      </div>
                    )}
                  </div>
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
    </Link>
  );
};

// Helper to generate a lightweight fingerprint for nested data comparison
// This replaces expensive JSON.stringify with fast numeric/string checks
const getDataFingerprint = (restaurant: any): string => {
  const offersCount = restaurant.merchant_offers?.length || 0;
  const offersActive = restaurant.merchant_offers?.filter((o: any) => o.is_active).length || 0;
  const categoriesCount = restaurant.merchant_categories?.length || 0;
  const happyHourCount = restaurant.merchant_happy_hour?.length || 0;
  const reviewsCount = restaurant.merchant_reviews?.length || 0;
  const publishedReviewsCount = restaurant.merchant_reviews?.filter((r: any) => r.status === 'published').length || 0;
  
  return `${offersCount}-${offersActive}-${categoriesCount}-${happyHourCount}-${reviewsCount}-${publishedReviewsCount}`;
};

// Memoize to prevent unnecessary re-renders when restaurant data hasn't changed
// Uses fingerprint comparison instead of expensive JSON.stringify
export const SearchResultCard = React.memo(SearchResultCardComponent, (prevProps, nextProps) => {
  // Quick checks for primitive values first (fast path)
  if (prevProps.restaurant.id !== nextProps.restaurant.id) return false;
  if (prevProps.restaurant.restaurant_name !== nextProps.restaurant.restaurant_name) return false;
  if (prevProps.restaurant.logo_url !== nextProps.restaurant.logo_url) return false;
  if (prevProps.restaurant.neighborhood !== nextProps.restaurant.neighborhood) return false;
  if (prevProps.isMobile !== nextProps.isMobile) return false;
  
  // Fingerprint comparison for nested data - much faster than JSON.stringify
  // This captures changes in counts and active status without serializing entire objects
  const prevFingerprint = getDataFingerprint(prevProps.restaurant);
  const nextFingerprint = getDataFingerprint(nextProps.restaurant);
  
  return prevFingerprint === nextFingerprint;
});
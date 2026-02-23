import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { getTodaysHappyHour, getMenuTypeBadge } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { GoogleRatingBadge } from '@/components/GoogleRatingBadge';

interface MobileCarouselCardProps {
  merchant: {
    id: number;
    restaurant_name: string;
    logo_url?: string | null;
    neighborhood?: string | null;
    slug?: string | null;
    merchant_happy_hour?: Array<{
      day_of_week: number;
      happy_hour_start: string;
      happy_hour_end: string;
    }>;
    happy_hour_deals?: Array<{
      active: boolean;
      menu_type: 'food_and_drinks' | 'drinks_only' | null;
    }>;
    merchant_reviews?: Array<{
      id: string;
      status: string;
      merchant_review_ratings?: Array<{
        rating: number;
      }>;
    }>;
    merchant_google_ratings?: Array<{
      google_rating: number;
      google_review_count: number;
      google_rating_url: string | null;
      match_confidence: string;
    }>;
  };
  onClick?: () => void;
}

export const MobileCarouselCard: React.FC<MobileCarouselCardProps> = ({ 
  merchant, 
  onClick 
}) => {
  const { track, trackFunnel } = useAnalytics();
  
  // Calculate rating locally from pre-fetched data (avoids N+1 query)
  const ratingData = useMemo(() => {
    const reviews = merchant.merchant_reviews?.filter((r) => r.status === 'published') || [];
    if (reviews.length === 0) return null;
    
    let totalSum = 0;
    let totalCount = 0;
    
    reviews.forEach((review) => {
      review.merchant_review_ratings?.forEach((r) => {
        totalSum += r.rating;
        totalCount += 1;
      });
    });
    
    if (totalCount === 0) return null;
    
    return {
      overallAverage: totalSum / totalCount,
      reviewCount: reviews.length
    };
  }, [merchant.merchant_reviews]);

  // Google rating fallback
  const googleRating = useMemo(() => {
    if (ratingData) return null;
    const gr = Array.isArray(merchant.merchant_google_ratings)
      ? merchant.merchant_google_ratings?.[0]
      : merchant.merchant_google_ratings;
    if (gr?.google_rating && gr.match_confidence !== 'no_match') return gr;
    return null;
  }, [ratingData, merchant.merchant_google_ratings]);

  const todaysHappyHourText = getTodaysHappyHour(merchant.merchant_happy_hour || []);
  const menuTypeBadge = getMenuTypeBadge(merchant.happy_hour_deals || []);

  // Build the merchant URL
  const merchantUrl = `/restaurant/${merchant.slug || merchant.id}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow native behavior for right-click, middle-click, ctrl+click, cmd+click
    if (e.ctrlKey || e.metaKey || e.button === 1 || e.button === 2) {
      return; // Let browser handle it natively
    }
    
    track({
      eventType: 'click',
      eventCategory: 'carousel',
      eventAction: 'carousel_card_clicked',
      merchantId: merchant.id,
      metadata: {
        isMobile: true,
        merchantName: merchant.restaurant_name,
      },
    });
    
    trackFunnel({
      funnelStep: 'merchant_clicked',
      merchantId: merchant.id,
      stepOrder: 4
    });
    
    onClick?.();
  };

  return (
    <Link 
      to={merchantUrl}
      onClick={handleClick}
      className="flex-shrink-0 w-52 bg-card border rounded-xl p-3 cursor-pointer mr-2 active:scale-[0.98] transition-all contain-layout block"
      style={{ scrollSnapAlign: 'start' }}
      draggable={false}
    >
      {/* Logo - compact centered */}
      <div className="flex justify-center mb-2">
        <div className={`w-20 h-20 ${merchant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden`}>
          {merchant.logo_url ? (
            <img 
              src={merchant.logo_url} 
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-contain p-1.5"
              width={80}
              height={80}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <span className="text-muted-foreground font-bold text-2xl">
              {merchant.restaurant_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
      
      {/* Merchant name */}
      <h4 className="font-bold text-base text-foreground line-clamp-1 mb-1 text-center">
        {merchant.restaurant_name}
      </h4>
      
      {/* Rating + Neighborhood row */}
      <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-1.5">
        {ratingData?.overallAverage && (
          <>
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{ratingData.overallAverage.toFixed(1)}</span>
            {merchant.neighborhood && <span className="text-muted-foreground/60">•</span>}
          </>
        )}
        {!ratingData && googleRating && (
          <>
            <GoogleRatingBadge
              rating={googleRating.google_rating}
              reviewCount={googleRating.google_review_count}
              googleUrl={googleRating.google_rating_url}
              size="sm"
            />
            {merchant.neighborhood && <span className="text-muted-foreground/60">•</span>}
          </>
        )}
        {merchant.neighborhood && (
          <span className="truncate">{merchant.neighborhood}</span>
        )}
      </div>
      
      {/* Happy hour badge */}
      {todaysHappyHourText !== 'No Happy Hour Today' ? (
        <div className="flex justify-center mb-1.5">
          <span className="text-xs font-semibold text-white bg-amber-500/90 px-2.5 py-1 rounded-full shadow-sm inline-flex items-center gap-1 leading-tight truncate max-w-full">
            🍻 {todaysHappyHourText}
          </span>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1.5 text-center font-medium">
          No happy hour today
        </div>
      )}
      
      {/* Menu type badge */}
      {menuTypeBadge && (
        <div className="flex justify-center">
          <Badge 
            variant="secondary" 
            className={`text-xs px-2 py-0.5 font-semibold shadow-sm ${
              menuTypeBadge.type === 'food_and_drinks' 
                ? 'bg-teal-500/90 hover:bg-teal-600 text-white' 
                : 'bg-purple-500/90 hover:bg-purple-600 text-white'
            }`}
          >
            {menuTypeBadge.emoji} {menuTypeBadge.label}
          </Badge>
        </div>
      )}
    </Link>
  );
};

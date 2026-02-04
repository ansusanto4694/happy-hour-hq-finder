import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from 'lucide-react';
import { getTodaysHappyHour, getMenuTypeBadge } from "@/utils/timeUtils";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CarouselCardProps {
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
  };
  onClick?: (merchantId: string) => void;
}

export const CarouselCard: React.FC<CarouselCardProps> = ({ merchant, onClick }) => {
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

  const todaysHappyHour = merchant.merchant_happy_hour ? getTodaysHappyHour(merchant.merchant_happy_hour) : 'No Happy Hour Today';
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
      metadata: { merchantName: merchant.restaurant_name },
    });
    
    trackFunnel({
      funnelStep: 'merchant_clicked',
      merchantId: merchant.id,
      stepOrder: 4
    });
    
    onClick?.(merchant.id.toString());
  };

  return (
    <Link 
      to={merchantUrl} 
      onClick={handleClick} 
      className="block"
      draggable={false}
    >
      <Card 
        className="cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 bg-card border border-border h-40"
      >
      <CardContent className="p-4 h-full flex items-center space-x-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-24 h-24 bg-white border border-border rounded-lg flex items-center justify-center overflow-hidden">
          {merchant.logo_url ? (
            <img
              src={merchant.logo_url}
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-contain"
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-primary font-semibold text-xl">
                {merchant.restaurant_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* Merchant Name and Happy Hour */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg leading-tight truncate">
            {merchant.restaurant_name}
          </h3>
          {/* Rating */}
          {ratingData?.overallAverage && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium text-foreground">
                {ratingData.overallAverage.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({ratingData.reviewCount})
              </span>
            </div>
          )}
          <div className="mt-1.5 flex flex-col gap-1.5">
            {todaysHappyHour !== 'No Happy Hour Today' ? (
              <span className="text-sm font-semibold text-white bg-amber-500/90 px-3 py-1.5 rounded-full shadow-sm inline-flex items-center gap-1 leading-tight w-fit">
                🍻 {todaysHappyHour}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">
                No happy hour today
              </span>
            )}
            {menuTypeBadge && (
              <Badge 
                variant="secondary" 
                className={`text-xs px-2 py-1 font-semibold shadow-sm w-fit ${
                  menuTypeBadge.type === 'food_and_drinks' 
                    ? 'bg-teal-500/90 hover:bg-teal-600 text-white' 
                    : 'bg-purple-500/90 hover:bg-purple-600 text-white'
                }`}
              >
                {menuTypeBadge.emoji} {menuTypeBadge.label}
              </Badge>
            )}
          </div>
          {merchant.neighborhood && (
            <p className="text-sm text-muted-foreground mt-1">
              {merchant.neighborhood}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

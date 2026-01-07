import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { getTodaysHappyHour, getMenuTypeBadge } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useMerchantRating } from '@/hooks/useMerchantRating';

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
  };
  onClick?: () => void;
}

export const MobileCarouselCard: React.FC<MobileCarouselCardProps> = ({ 
  merchant, 
  onClick 
}) => {
  const { track, trackFunnel } = useAnalytics();
  const { data: ratingData } = useMerchantRating(merchant.id);
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
      className="flex-shrink-0 w-52 min-h-[220px] bg-card border rounded-xl p-3 cursor-pointer mr-2 active:scale-[0.98] transition-all contain-layout block"
      style={{ scrollSnapAlign: 'start' }}
      draggable={false}
    >
      {/* Logo - compact centered with fixed aspect ratio */}
      <div className="flex justify-center mb-2">
        <div className={`w-20 h-20 aspect-square ${merchant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden`}>
          {merchant.logo_url ? (
            <img 
              src={merchant.logo_url} 
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-contain p-1.5"
              width={80}
              height={80}
              loading="lazy"
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
      
      {/* Menu type badge - reserve space even when empty */}
      <div className="flex justify-center min-h-[24px]">
        {menuTypeBadge && (
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
        )}
      </div>
    </Link>
  );
};

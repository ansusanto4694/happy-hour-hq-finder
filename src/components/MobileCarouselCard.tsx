import React from 'react';
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
  onClick: () => void;
}

export const MobileCarouselCard: React.FC<MobileCarouselCardProps> = ({ 
  merchant, 
  onClick 
}) => {
  const { track, trackFunnel } = useAnalytics();
  const { data: ratingData } = useMerchantRating(merchant.id);
  const todaysHappyHourText = getTodaysHappyHour(merchant.merchant_happy_hour || []);
  const menuTypeBadge = getMenuTypeBadge(merchant.happy_hour_deals || []);

  const handleClick = async () => {
    await track({
      eventType: 'click',
      eventCategory: 'carousel',
      eventAction: 'carousel_card_clicked',
      merchantId: merchant.id,
      metadata: {
        isMobile: true,
        merchantName: merchant.restaurant_name,
      },
    });
    
    await trackFunnel({
      funnelStep: 'merchant_clicked',
      merchantId: merchant.id,
      stepOrder: 4
    });
    
    onClick();
  };

  return (
    <div 
      onClick={handleClick}
      className="flex-shrink-0 w-64 h-[140px] bg-card border rounded-lg p-3 cursor-pointer mr-2 active:scale-[0.98] transition-all contain-layout"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="flex items-start gap-3 h-full">
        {/* Logo - compact, on left */}
        <div className={`flex-shrink-0 w-14 h-14 ${merchant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-border rounded-lg flex items-center justify-center overflow-hidden`}>
          {merchant.logo_url ? (
            <img 
              src={merchant.logo_url} 
              alt={`${merchant.restaurant_name} logo`}
              className="w-full h-full object-contain p-1"
              width={56}
              height={56}
              loading="lazy"
            />
          ) : (
            <span className="text-muted-foreground font-bold text-lg">
              {merchant.restaurant_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* Content - stacked vertically on right */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Merchant name - single line */}
          <h4 className="font-bold text-sm text-foreground truncate leading-tight">
            {merchant.restaurant_name}
          </h4>
          
          {/* Rating */}
          {ratingData?.overallAverage && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{ratingData.overallAverage.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({ratingData.reviewCount})</span>
            </div>
          )}
          
          {/* Happy hour time - compact badge */}
          {todaysHappyHourText !== 'No Happy Hour Today' ? (
            <span className="text-xs font-semibold text-white bg-amber-500 px-2 py-0.5 rounded-full w-fit leading-tight">
              🍻 {todaysHappyHourText}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No happy hour today</span>
          )}
          
          {/* Menu type badge */}
          {menuTypeBadge && (
            <Badge 
              variant="secondary" 
              className={`text-[10px] px-1.5 py-0.5 w-fit font-semibold ${
                menuTypeBadge.type === 'food_and_drinks' 
                  ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              {menuTypeBadge.emoji} {menuTypeBadge.label}
            </Badge>
          )}
          
          {/* Neighborhood */}
          {merchant.neighborhood && (
            <p className="text-xs text-muted-foreground truncate">
              📍 {merchant.neighborhood}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

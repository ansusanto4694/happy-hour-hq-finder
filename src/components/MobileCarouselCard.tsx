import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin } from 'lucide-react';
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
      className="flex-shrink-0 w-52 bg-card border rounded-xl p-3 cursor-pointer mr-2 active:scale-[0.98] transition-all contain-layout"
      style={{ scrollSnapAlign: 'start' }}
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
        <div className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded-md mb-1.5 truncate text-center">
          🍻 {todaysHappyHourText}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground px-2 py-1 mb-1.5 text-center">
          No happy hour today
        </div>
      )}
      
      {/* Menu type badge */}
      {menuTypeBadge && (
        <div className="flex justify-center">
          <Badge 
            variant="secondary" 
            className={`text-xs px-2 py-0.5 font-medium ${
              menuTypeBadge.type === 'food_and_drinks' 
                ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20' 
                : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
            }`}
          >
            {menuTypeBadge.emoji} {menuTypeBadge.label}
          </Badge>
        </div>
      )}
    </div>
  );
};

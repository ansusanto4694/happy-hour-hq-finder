import React from 'react';
import { getTodaysHappyHour } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MobileCarouselCardProps {
  merchant: {
    id: number;
    restaurant_name: string;
    logo_url?: string | null;
    neighborhood?: string | null;
    merchant_happy_hour?: Array<{
      day_of_week: number;
      happy_hour_start: string;
      happy_hour_end: string;
    }>;
  };
  onClick: () => void;
}

export const MobileCarouselCard: React.FC<MobileCarouselCardProps> = ({ 
  merchant, 
  onClick 
}) => {
  const { track, trackFunnel } = useAnalytics();
  const todaysHappyHourText = getTodaysHappyHour(merchant.merchant_happy_hour || []);

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
      className="flex-shrink-0 w-64 min-h-[200px] bg-card border rounded-lg p-5 cursor-pointer mr-2 active:scale-[0.98] active:shadow-sm transition-all"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Merchant logo or initial */}
      <div className={`w-20 h-20 mx-auto mb-3 ${merchant.logo_url ? 'bg-white' : 'bg-gradient-to-br from-orange-100 to-amber-100'} border border-gray-200 rounded-lg shadow-sm flex items-center justify-center overflow-hidden`}>
        {merchant.logo_url ? (
          <img 
            src={merchant.logo_url} 
            alt={`${merchant.restaurant_name} logo`}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-gray-500 font-bold text-xl">
            {merchant.restaurant_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Merchant name */}
      <h4 className="text-foreground font-bold text-lg text-center mb-3 line-clamp-2 px-1 leading-snug">
        {merchant.restaurant_name}
      </h4>

      {/* Happy hour status */}
      <div className="text-center">
        {todaysHappyHourText !== 'No Happy Hour Today' ? (
          <span className="text-base font-semibold text-white bg-amber-500/90 px-3 py-2 rounded-full shadow-sm inline-flex items-center gap-1 leading-tight">
            🍻 {todaysHappyHourText}
          </span>
        ) : (
          <span className="text-base text-muted-foreground font-medium leading-relaxed">
            No happy hour today
          </span>
        )}
        {merchant.neighborhood && (
          <p className="text-sm text-muted-foreground/80 mt-2">
            {merchant.neighborhood}
          </p>
        )}
      </div>
    </div>
  );
};
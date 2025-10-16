import React from 'react';
import { getTodaysHappyHour } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface MobileCarouselCardProps {
  merchant: {
    id: number;
    restaurant_name: string;
    logo_url?: string | null;
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
      className="flex-shrink-0 w-64 bg-card border rounded-lg p-4 cursor-pointer mr-2 hover:shadow-md transition-shadow"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Merchant logo or initial */}
      <div className="w-20 h-20 mx-auto mb-3 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
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
      <h4 className="text-foreground font-medium text-base text-center mb-3 line-clamp-2 px-1">
        {merchant.restaurant_name}
      </h4>

      {/* Happy hour status */}
      <div className="text-center">
        {todaysHappyHourText !== 'No Happy Hour Today' ? (
          <span className="text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            {todaysHappyHourText}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            No happy hour today
          </span>
        )}
      </div>
    </div>
  );
};
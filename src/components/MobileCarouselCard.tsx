import React from 'react';
import { getTodaysHappyHour } from '@/utils/timeUtils';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  
  // Mock rating for visual enhancement
  const rating = (Math.random() * 0.8 + 4.2).toFixed(1);
  const isPopular = Math.random() > 0.6;

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
      className="flex-shrink-0 w-72 bg-card border-2 border-gray-200 rounded-xl p-4 cursor-pointer mr-3 hover:shadow-lg hover:border-orange-200 transition-all duration-200 active:scale-95"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Merchant logo - Larger with gradient background */}
      <div className="w-24 h-24 mx-auto mb-3 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
        {merchant.logo_url ? (
          <img 
            src={merchant.logo_url} 
            alt={`${merchant.restaurant_name} logo`}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-orange-500 font-bold text-3xl">
            {merchant.restaurant_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Merchant name - Larger font */}
      <h4 className="text-foreground font-bold text-base text-center mb-2 line-clamp-2 px-1">
        {merchant.restaurant_name}
      </h4>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-gray-900">{rating}</span>
        </div>
        {isPopular && (
          <span className="text-xs text-orange-600 font-medium">🔥 Popular</span>
        )}
      </div>

      {/* Happy hour status - More prominent */}
      <div className="text-center">
        {todaysHappyHourText !== 'No Happy Hour Today' ? (
          <Badge className="text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 shadow-md">
            🍻 {todaysHappyHourText}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            No happy hour today
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { getTodaysHappyHour } from '@/utils/timeUtils';

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
  const todaysHappyHourText = getTodaysHappyHour(merchant.merchant_happy_hour || []);

  return (
    <div 
      onClick={onClick}
      className="flex-shrink-0 w-36 bg-white/20 backdrop-blur-sm rounded-lg p-3 cursor-pointer"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Merchant logo or initial */}
      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/30 flex items-center justify-center overflow-hidden">
        {merchant.logo_url ? (
          <img 
            src={merchant.logo_url} 
            alt={merchant.restaurant_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-bold text-lg">
            {merchant.restaurant_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Merchant name */}
      <h4 className="text-white font-medium text-sm text-center mb-2 line-clamp-2">
        {merchant.restaurant_name}
      </h4>

      {/* Happy hour status */}
      <div className="text-center">
        {todaysHappyHourText !== 'No Happy Hour Today' ? (
          <span className="text-xs text-yellow-200 bg-white/20 px-2 py-1 rounded-full">
            {todaysHappyHourText}
          </span>
        ) : (
          <span className="text-xs text-white/60">
            No happy hour today
          </span>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { HappyHourDealsManager } from '@/components/HappyHourDealsManager';
import { HappyHourDealsDisplay } from '@/components/HappyHourDealsDisplay';
import { useAuth } from '@/hooks/useAuth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { HappyHourDeal } from '@/components/happy-hour-deals/types';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  street_address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  merchant_happy_hour: Array<{
    id: string;
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
}

interface RestaurantDealsSectionProps {
  restaurantId: number;
  restaurant: Restaurant;
  deals: HappyHourDeal[];
}

export const RestaurantDealsSection: React.FC<RestaurantDealsSectionProps> = ({ restaurantId, restaurant, deals }) => {
  const { isAdmin } = useAuth();
  const { track } = useAnalytics();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = async (newIsOpen: boolean) => {
    await track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: newIsOpen ? 'deals_expanded' : 'deals_collapsed',
      merchantId: restaurantId,
    });
    setIsOpen(newIsOpen);
  };
  
  if (isMobile) {
    return (
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Happy Hour Menu</h3>
          <div className="flex items-center gap-2">
            {isAdmin && <HappyHourDealsManager restaurantId={restaurantId} />}
            <CollapsibleTrigger asChild>
              <button 
                className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                aria-label={isOpen ? "Collapse happy hour menu" : "Expand happy hour menu"}
              >
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent>
      <HappyHourDealsDisplay restaurantId={restaurantId} deals={deals} />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Desktop version - not collapsible
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Happy Hour Menu</h3>
        {isAdmin && <HappyHourDealsManager restaurantId={restaurantId} />}
      </div>
      
      <div>
        <HappyHourDealsDisplay restaurantId={restaurantId} deals={deals} />
      </div>
    </div>
  );
};

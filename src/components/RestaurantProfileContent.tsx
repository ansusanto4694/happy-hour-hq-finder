
import React, { useCallback } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RestaurantBasicInfo } from '@/components/RestaurantBasicInfo';
import { RestaurantContactInfo } from '@/components/RestaurantContactInfo';
import { RestaurantHappyHours } from '@/components/RestaurantHappyHours';
import { RestaurantDealsSection } from '@/components/RestaurantDealsSection';
import { RestaurantEventsFeed } from '@/components/RestaurantEventsFeed';
import { RestaurantProfileEditor } from '@/components/RestaurantProfileEditor';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { MerchantOffersSection } from '@/components/merchant-offers/MerchantOffersSection';
import { MobileHeroSection } from '@/components/MobileHeroSection';
import { useMerchantOffers } from '@/hooks/useMerchantOffers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  street_address_line_2?: string | null;
  city: string;
  state: string;
  zip_code: string;
  phone_number?: string | null;
  website?: string | null;
  logo_url?: string | null;
  merchant_happy_hour: Array<{
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
  merchant_categories?: Array<{
    id: string;
    categories: {
      id: string;
      name: string;
      slug: string;
      parent_id: string | null;
    };
  }>;
}

interface RestaurantProfileContentProps {
  restaurant: Restaurant;
}

export const RestaurantProfileContent: React.FC<RestaurantProfileContentProps> = ({ restaurant }) => {
  const { isAdmin } = useAuth();
  const { data: offers } = useMerchantOffers(restaurant.id);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Transform the merchant_happy_hour data to include IDs for the editor
  const restaurantWithIds = {
    ...restaurant,
    merchant_happy_hour: restaurant.merchant_happy_hour.map(hh => ({
      ...hh,
      id: `${restaurant.id}-${hh.day_of_week}`, // Create a unique ID
    }))
  };

  return (
    <div className="w-full sm:px-6 lg:px-8 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Hero Section */}
        {isMobile && <MobileHeroSection restaurant={restaurant} />}
        
        {/* Restaurant Header Card - Hidden on Mobile */}
        <Card className={`bg-white shadow-lg mb-8 ${isMobile ? 'hidden' : ''}`}>
          <CardContent className="p-8">
            {/* Header with Restaurant Name, Logo and Edit Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Restaurant Logo */}
                <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {restaurant.logo_url ? (
                    <img 
                      src={restaurant.logo_url} 
                      alt={`${restaurant.restaurant_name} logo`}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs font-medium">LOGO</span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <RestaurantProfileEditor restaurant={restaurantWithIds} />
                ) : (
                  <div className="hidden sm:block">
                    <ReportIssueModal
                      merchantId={restaurant.id}
                      merchantName={restaurant.restaurant_name}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Category tags */}
            {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {restaurant.merchant_categories.map((merchantCategory) => (
                  <Badge 
                    key={merchantCategory.id} 
                    variant="outline" 
                    className="text-sm px-3 py-1"
                  >
                    {merchantCategory.categories.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Left Column (3/4 width) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Current Offers Section - Only show if offers exist */}
            {offers && offers.length > 0 && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <MerchantOffersSection restaurantId={restaurant.id} />
                </CardContent>
              </Card>
            )}

            {/* Happy Hour Deals Section */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <RestaurantDealsSection restaurantId={restaurant.id} restaurant={restaurantWithIds} />
              </CardContent>
            </Card>

            {/* Restaurant Events Feed */}
            <RestaurantEventsFeed restaurantId={restaurant.id} />
          </div>

          {/* Sidebar - Right Column (1/4 width, sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Information Card */}
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <RestaurantContactInfo
                    streetAddress={restaurant.street_address}
                    streetAddressLine2={restaurant.street_address_line_2}
                    city={restaurant.city}
                    state={restaurant.state}
                    zipCode={restaurant.zip_code}
                    phoneNumber={restaurant.phone_number}
                    website={restaurant.website}
                  />
                </CardContent>
              </Card>

              {/* Happy Hours Card */}
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <RestaurantHappyHours happyHours={restaurant.merchant_happy_hour || []} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

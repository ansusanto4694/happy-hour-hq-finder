
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { RestaurantContactInfo } from '@/components/RestaurantContactInfo';
import { RestaurantHappyHours } from '@/components/RestaurantHappyHours';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { MerchantOffer } from '@/components/merchant-offers/types';
import { HappyHourDeal } from '@/components/happy-hour-deals/types';
import { RestaurantProfileEditor } from '@/components/RestaurantProfileEditor';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { MerchantOffersSection } from '@/components/merchant-offers/MerchantOffersSection';
import { RestaurantDealsSection } from '@/components/RestaurantDealsSection';
import { RestaurantEventsFeed } from '@/components/RestaurantEventsFeed';

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
  offers: MerchantOffer[];
  deals: HappyHourDeal[];
  events: any[];
  isLoading?: boolean;
}

export const RestaurantProfileContent: React.FC<RestaurantProfileContentProps> = ({ 
  restaurant, 
  offers,
  deals,
  events,
  isLoading = false
}) => {
  usePerformanceMonitor('RestaurantProfileContent');
  
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Transform the merchant_happy_hour data to include IDs for the editor
  const restaurantWithIds = {
    ...restaurant,
    merchant_happy_hour: restaurant.merchant_happy_hour.map(hh => ({
      ...hh,
      id: `${restaurant.id}-${hh.day_of_week}`, // Create a unique ID
    }))
  };

  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Restaurant profile link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Restaurant Header Card */}
        <Card className="bg-white shadow-lg mb-8">
          <CardContent className="p-8">
            {/* Header with Restaurant Name, Logo and Edit Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {/* Restaurant Logo */}
                <div className="w-20 h-20 bg-white border-2 border-border rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {restaurant.logo_url ? (
                    <OptimizedImage
                      src={restaurant.logo_url}
                      alt={`${restaurant.restaurant_name} logo`}
                      objectFit="contain"
                      className="w-full h-full p-2"
                      fallbackSrc="/placeholder.svg"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs font-medium">LOGO</span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="mobile-icon"
                  onClick={handleShareProfile}
                  aria-label="Share restaurant profile"
                >
                  <Share className="h-4 w-4" />
                </Button>
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
                  <MerchantOffersSection restaurantId={restaurant.id} offers={offers} />
                </CardContent>
              </Card>
            )}

            {/* Happy Hour Deals Section */}
            <Card className="bg-white shadow-lg">
              <CardContent className="p-6">
                <RestaurantDealsSection 
                  restaurantId={restaurant.id} 
                  restaurant={restaurantWithIds}
                  deals={deals}
                />
              </CardContent>
            </Card>

            {/* Restaurant Events Feed */}
            <RestaurantEventsFeed restaurantId={restaurant.id} events={events} />
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

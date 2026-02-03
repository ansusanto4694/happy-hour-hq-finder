
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Utensils, PenLine, Star, MapPin } from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { RestaurantBasicInfo } from '@/components/RestaurantBasicInfo';
import { RestaurantContactInfo } from '@/components/RestaurantContactInfo';
import { RestaurantHappyHours } from '@/components/RestaurantHappyHours';
import { RestaurantDealsSection } from '@/components/RestaurantDealsSection';
import { RestaurantEventsFeed } from '@/components/RestaurantEventsFeed';
import { RestaurantProfileEditor } from '@/components/RestaurantProfileEditor';
import { ReportIssueModal } from '@/components/ReportIssueModal';
import { MerchantOffersSection } from '@/components/merchant-offers/MerchantOffersSection';
import { MerchantReviews } from '@/components/MerchantReviews';
import { MobileCTABar } from '@/components/MobileCTABar';
import { useMerchantOffers } from '@/hooks/useMerchantOffers';
import { useMerchantRating } from '@/hooks/useMerchantRating';
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
  latitude?: number | null;
  longitude?: number | null;
  neighborhood?: string | null;
  slug?: string | null;
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
  const { data: ratingData } = useMerchantRating(restaurant.id);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Use slug for URLs when available for SEO
  const merchantUrlId = restaurant.slug || restaurant.id;
  
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
    <div className="w-full">
      <div className={`max-w-[1600px] mx-auto ${isMobile ? 'pb-24' : 'pt-40'}`}>
        {/* Mobile Hero Section */}
        {isMobile ? (
          <div className="bg-white py-8 px-4 relative overflow-hidden border-b border-border">
            {/* Subtle shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="flex flex-col items-center text-center space-y-4 relative">
              {/* Centered Logo - 96px */}
              <div className="w-24 h-24 bg-white border-2 border-transparent rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.restaurant_name} logo`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs font-medium">LOGO</span>
                )}
              </div>

              {/* Centered Restaurant Name - text-2xl */}
              <h1 className="text-2xl font-bold text-foreground">{restaurant.restaurant_name}</h1>

              {/* Rating Display */}
              {ratingData?.overallAverage !== null && ratingData?.overallAverage !== undefined && (
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-xl font-bold">{ratingData.overallAverage.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({ratingData.reviewCount} {ratingData.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* Centered Category Badges with Icons */}
              {restaurant.merchant_categories && restaurant.merchant_categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {restaurant.merchant_categories.map((merchantCategory) => (
                    <Badge 
                      key={merchantCategory.id} 
                      variant="outline"
                      className="rounded-full px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 border-amber-500/50 text-amber-600 bg-amber-500/10"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      {merchantCategory.categories.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons - Admin Only */}
              {isAdmin && (
                <div className="flex items-center justify-center pt-2">
                  <RestaurantProfileEditor restaurant={restaurantWithIds} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Header Card */
          <Card className="bg-white shadow-lg mb-8 mx-4 sm:mx-6 lg:mx-4">
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
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">LOGO</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{restaurant.restaurant_name}</h1>
                    {ratingData?.overallAverage !== null && ratingData?.overallAverage !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="text-lg font-bold">{ratingData.overallAverage.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({ratingData.reviewCount} {ratingData.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="default"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Link to={`/restaurant/${merchantUrlId}/review`}>
                      <PenLine className="h-4 w-4 mr-2" />
                      Write a Review
                    </Link>
                  </Button>
                  <FavoriteButton 
                    merchantId={restaurant.id}
                    variant="outline"
                    size="icon"
                  />
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
        )}

        {/* Two-Column Layout */}
        <div className="relative bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 sm:px-6 lg:px-4 py-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Offers Section - Only show if offers exist */}
            {offers && offers.length > 0 && (
              <Card className={`shadow-lg border-l-4 border-amber-500 ${isMobile ? 'bg-white' : 'bg-white'}`}>
                <CardContent className="p-6">
                  <MerchantOffersSection restaurantId={restaurant.id} />
                </CardContent>
              </Card>
            )}

            {/* Happy Hour Deals Section */}
            <Card className="shadow-lg border-l-4 border-amber-500 bg-white">
              <CardContent className="p-6">
                <RestaurantDealsSection restaurantId={restaurant.id} restaurant={restaurantWithIds} />
              </CardContent>
            </Card>

            {/* Restaurant Events Feed - Hidden until we have restaurant partners */}
            {/* <RestaurantEventsFeed restaurantId={restaurant.id} /> */}

            {/* Reviews Section */}
            <Card className="shadow-lg border-l-4 border-amber-500 bg-white">
              <CardContent className="p-6">
                <MerchantReviews 
                  merchantId={restaurant.id} 
                  merchantName={restaurant.restaurant_name}
                  merchantSlug={restaurant.slug}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column (1/4 width, sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Contact Information Card */}
              <Card className={`shadow-lg border-l-4 border-amber-500 ${isMobile ? 'bg-white' : 'bg-white'}`}>
                <CardContent className="p-6">
            <RestaurantContactInfo
              streetAddress={restaurant.street_address}
              streetAddressLine2={restaurant.street_address_line_2}
              city={restaurant.city}
              state={restaurant.state}
              zipCode={restaurant.zip_code}
              phoneNumber={restaurant.phone_number}
              website={restaurant.website}
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
              restaurantName={restaurant.restaurant_name}
              neighborhood={restaurant.neighborhood}
            />
                </CardContent>
              </Card>

              {/* Happy Hours Card */}
              <Card className="shadow-lg border-l-4 border-amber-500 bg-white">
                <CardContent className="p-6">
                  <RestaurantHappyHours happyHours={restaurant.merchant_happy_hour || []} />
                </CardContent>
              </Card>

              {/* Neighborhood Backlink */}
              {restaurant.neighborhood && (
                <Card className="shadow-lg border-l-4 border-amber-500 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-amber-500" />
                      <h3 className="font-semibold text-foreground">Explore the Area</h3>
                    </div>
                    <Link 
                      to={`/happy-hour/${restaurant.city.toLowerCase()}-${restaurant.state.toLowerCase()}/${restaurant.neighborhood.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`}
                      className="text-amber-600 hover:text-amber-700 hover:underline font-medium"
                    >
                      More Happy Hours in {restaurant.neighborhood} →
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Mobile Sticky CTA Bar */}
        {isMobile && (
          <MobileCTABar
            phoneNumber={restaurant.phone_number}
            address={{
              street: restaurant.street_address,
              city: restaurant.city,
              state: restaurant.state,
              zipCode: restaurant.zip_code,
            }}
            website={restaurant.website}
          />
        )}
      </div>
    </div>
  );
};

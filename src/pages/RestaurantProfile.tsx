
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RestaurantHeader } from '@/components/RestaurantHeader';
import { RestaurantProfileContent } from '@/components/RestaurantProfileContent';
import { trackFunnelStep } from '@/utils/analytics';
import { useRestaurantProfileData } from '@/hooks/useRestaurantProfileData';

const RestaurantProfile = () => {
  const { id } = useParams();
  const restaurantId = id ? parseInt(id, 10) : undefined;
  
  useEffect(() => {
    if (restaurantId) {
      trackFunnelStep({ funnelStep: 'profile_viewed', merchantId: restaurantId, stepOrder: 5 });
    }
  }, [restaurantId]);
  
  const { restaurant, offers, deals, events, isLoading, error } = useRestaurantProfileData(restaurantId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading restaurant...</h2>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Restaurant not found</h2>
          <Button onClick={() => window.history.back()} className="mt-4">
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantHeader 
        merchantId={restaurant.id} 
        merchantName={restaurant.restaurant_name} 
      />
      <RestaurantProfileContent 
        restaurant={restaurant} 
        offers={offers}
        deals={deals}
        events={events}
      />
    </div>
  );
};

export default RestaurantProfile;

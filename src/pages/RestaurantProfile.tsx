import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getRestaurantWithRelations } from '@/utils/restaurantService';
import { RestaurantHeader } from '@/components/RestaurantHeader';
import { RestaurantProfileContent } from '@/components/RestaurantProfileContent';
import { SEOHead } from '@/components/SEOHead';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const RestaurantProfile = () => {
  const { id } = useParams();
  
  const { data: restaurant, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      if (!id) throw new Error('Restaurant ID is required');
      
      const restaurantId = parseInt(id, 10);
      if (isNaN(restaurantId)) throw new Error('Invalid restaurant ID');
      
      return await getRestaurantWithRelations(restaurantId);
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Restaurant</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Unable to load restaurant details. Please try again.'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-4">
            The restaurant you're looking for doesn't exist or may have been removed.
          </p>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  // Create SEO data
  const seoData = {
    title: `${restaurant.restaurant_name} - Restaurant Details`,
    description: `Find details, happy hours, and offers for ${restaurant.restaurant_name} in ${restaurant.city}, ${restaurant.state}.`,
    keywords: `${restaurant.restaurant_name}, restaurant, ${restaurant.city}, ${restaurant.state}, happy hour, dining`,
    canonical: `/restaurant/${restaurant.id}`
  };

  return (
    <>
      <SEOHead {...seoData} />
      <div className="min-h-screen bg-gray-50">
        <RestaurantHeader merchantId={restaurant.id} merchantName={restaurant.restaurant_name} />
        <RestaurantProfileContent restaurant={restaurant} />
      </div>
    </>
  );
};

export default RestaurantProfile;
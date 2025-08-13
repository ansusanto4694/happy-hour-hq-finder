import { RestaurantPublic } from '@/utils/restaurantService';

// Extended type that includes both public and potentially private data
// This allows components to work with both public and full restaurant data
export interface RestaurantDisplay extends RestaurantPublic {
  street_address: string; // Required for compatibility
  street_address_line_2?: string | null;
  phone_number?: string | null;
  website?: string | null;
  merchant_happy_hour?: Array<{
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
      parent_id?: string | null;
    };
  }>;
  merchant_offers?: Array<{
    id: string;
    offer_name: string;
    offer_description: string | null;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }>;
}

// Helper function to convert public restaurant data to display format
export const convertToDisplayRestaurant = (restaurant: RestaurantPublic): RestaurantDisplay => {
  return {
    ...restaurant,
    street_address: `${restaurant.city}, ${restaurant.state}`, // Fallback for address
    merchant_happy_hour: [],
    merchant_categories: [],
    merchant_offers: []
  };
};
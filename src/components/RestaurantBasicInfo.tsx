
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface RestaurantBasicInfoProps {
  restaurantName: string;
  restaurant?: Restaurant;
}

export const RestaurantBasicInfo: React.FC<RestaurantBasicInfoProps> = ({ 
  restaurantName, 
  restaurant 
}) => {
  const { toast } = useToast();

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
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{restaurantName}</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="mobile-icon"
          onClick={handleShareProfile}
          aria-label="Share restaurant profile"
        >
          <Share className="h-4 w-4" />
        </Button>
        {restaurant && (
          <div className="flex items-center">
            {/* The RestaurantProfileEditor will be rendered here */}
          </div>
        )}
      </div>
    </div>
  );
};

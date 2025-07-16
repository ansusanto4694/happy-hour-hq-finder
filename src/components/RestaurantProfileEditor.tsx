
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { BasicInfoForm } from '@/components/restaurant-profile-editor/BasicInfoForm';
import { AddressForm } from '@/components/restaurant-profile-editor/AddressForm';
import { HappyHoursForm } from '@/components/restaurant-profile-editor/HappyHoursForm';
import { LogoUpload } from '@/components/restaurant-profile-editor/LogoUpload';
import { useRestaurantMutations } from '@/components/restaurant-profile-editor/useRestaurantMutations';

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
    id: string;
    day_of_week: number;
    happy_hour_start: string;
    happy_hour_end: string;
  }>;
}

interface RestaurantProfileEditorProps {
  restaurant: Restaurant;
}

export const RestaurantProfileEditor: React.FC<RestaurantProfileEditorProps> = ({ restaurant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(restaurant.logo_url || null);
  const { updateRestaurantMutation, updateHappyHoursMutation } = useRestaurantMutations(restaurant.id);

  const [formData, setFormData] = useState({
    restaurant_name: restaurant.restaurant_name,
    street_address: restaurant.street_address,
    street_address_line_2: restaurant.street_address_line_2 || '',
    city: restaurant.city,
    state: restaurant.state,
    zip_code: restaurant.zip_code,
    phone_number: restaurant.phone_number || '',
    website: restaurant.website || '',
  });

  const [happyHours, setHappyHours] = useState(
    restaurant.merchant_happy_hour.map(hh => ({
      id: hh.id,
      day_of_week: hh.day_of_week,
      happy_hour_start: hh.happy_hour_start,
      happy_hour_end: hh.happy_hour_end,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateRestaurantMutation.mutateAsync(formData);
      await updateHappyHoursMutation.mutateAsync(happyHours);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHappyHourChange = (index: number, field: 'happy_hour_start' | 'happy_hour_end', value: string) => {
    setHappyHours(prev => prev.map((hh, i) => 
      i === index ? { ...hh, [field]: value } : hh
    ));
  };

  const addHappyHour = () => {
    setHappyHours(prev => [...prev, {
      id: `new-${Date.now()}`,
      day_of_week: 0,
      happy_hour_start: '17:00',
      happy_hour_end: '19:00',
    }]);
  };

  const removeHappyHour = (index: number) => {
    setHappyHours(prev => prev.filter((_, i) => i !== index));
  };

  const handleHappyHourDayChange = (index: number, day: number) => {
    setHappyHours(prev => prev.map((hh, i) => 
      i === index ? { ...hh, day_of_week: day } : hh
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Restaurant Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Restaurant Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoForm
            formData={{
              restaurant_name: formData.restaurant_name,
              phone_number: formData.phone_number,
              website: formData.website,
            }}
            onInputChange={handleInputChange}
          />

          <AddressForm
            formData={{
              street_address: formData.street_address,
              street_address_line_2: formData.street_address_line_2,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zip_code,
            }}
            onInputChange={handleInputChange}
          />

          <HappyHoursForm
            happyHours={happyHours}
            onHappyHourChange={handleHappyHourChange}
            onHappyHourDayChange={handleHappyHourDayChange}
            onAddHappyHour={addHappyHour}
            onRemoveHappyHour={removeHappyHour}
          />

          <LogoUpload
            restaurantId={restaurant.id}
            currentLogoUrl={logoUrl}
            onLogoUpdate={setLogoUrl}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateRestaurantMutation.isPending || updateHappyHoursMutation.isPending}
            >
              {updateRestaurantMutation.isPending || updateHappyHoursMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

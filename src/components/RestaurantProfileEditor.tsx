import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  website?: string | null;
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

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const RestaurantProfileEditor: React.FC<RestaurantProfileEditorProps> = ({ restaurant }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateRestaurantMutation = useMutation({
    mutationFn: async (updates: typeof formData) => {
      const { error } = await supabase
        .from('Merchant')
        .update(updates)
        .eq('id', restaurant.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id.toString()] });
      toast({
        title: "Success",
        description: "Restaurant information updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update restaurant information",
        variant: "destructive",
      });
      console.error('Error updating restaurant:', error);
    },
  });

  const updateHappyHoursMutation = useMutation({
    mutationFn: async (updates: typeof happyHours) => {
      // First, delete existing happy hours
      await supabase
        .from('merchant_happy_hour')
        .delete()
        .eq('store_id', restaurant.id);

      // Then insert the updated ones
      if (updates.length > 0) {
        const { error } = await supabase
          .from('merchant_happy_hour')
          .insert(
            updates.map(hh => ({
              store_id: restaurant.id,
              day_of_week: hh.day_of_week,
              happy_hour_start: hh.happy_hour_start,
              happy_hour_end: hh.happy_hour_end,
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurant.id.toString()] });
      toast({
        title: "Success",
        description: "Happy hour times updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update happy hour times",
        variant: "destructive",
      });
      console.error('Error updating happy hours:', error);
    },
  });

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
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="restaurant_name">Restaurant Name</Label>
              <Input
                id="restaurant_name"
                value={formData.restaurant_name}
                onChange={(e) => handleInputChange('restaurant_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address</h3>
            
            <div className="space-y-2">
              <Label htmlFor="street_address">Street Address</Label>
              <Input
                id="street_address"
                value={formData.street_address}
                onChange={(e) => handleInputChange('street_address', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street_address_line_2">Address Line 2 (Optional)</Label>
              <Input
                id="street_address_line_2"
                value={formData.street_address_line_2}
                onChange={(e) => handleInputChange('street_address_line_2', e.target.value)}
                placeholder="Suite, Apt, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Happy Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Happy Hours</h3>
              <Button type="button" variant="outline" size="sm" onClick={addHappyHour}>
                Add Happy Hour
              </Button>
            </div>

            <div className="space-y-3">
              {happyHours.map((hh, index) => (
                <div key={hh.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <select
                    value={hh.day_of_week}
                    onChange={(e) => handleHappyHourDayChange(index, parseInt(e.target.value))}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {DAYS_OF_WEEK.map((day, dayIndex) => (
                      <option key={dayIndex} value={dayIndex}>{day}</option>
                    ))}
                  </select>
                  
                  <Input
                    type="time"
                    value={hh.happy_hour_start}
                    onChange={(e) => handleHappyHourChange(index, 'happy_hour_start', e.target.value)}
                    className="w-32"
                  />
                  
                  <span className="text-gray-500">to</span>
                  
                  <Input
                    type="time"
                    value={hh.happy_hour_end}
                    onChange={(e) => handleHappyHourChange(index, 'happy_hour_end', e.target.value)}
                    className="w-32"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeHappyHour(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {happyHours.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">
                  No happy hours set. Click "Add Happy Hour" to add some.
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
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

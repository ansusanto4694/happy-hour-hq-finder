
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BasicInfoFormData {
  restaurant_name: string;
  phone_number: string;
  website: string;
}

interface BasicInfoFormProps {
  formData: BasicInfoFormData;
  onInputChange: (field: keyof BasicInfoFormData, value: string) => void;
}

export const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, onInputChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="restaurant_name">Restaurant Name</Label>
        <Input
          id="restaurant_name"
          value={formData.restaurant_name}
          onChange={(e) => onInputChange('restaurant_name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          value={formData.phone_number}
          onChange={(e) => onInputChange('phone_number', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website}
          onChange={(e) => onInputChange('website', e.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
};

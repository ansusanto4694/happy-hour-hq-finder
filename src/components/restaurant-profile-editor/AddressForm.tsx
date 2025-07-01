
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressFormData {
  street_address: string;
  street_address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
}

interface AddressFormProps {
  formData: AddressFormData;
  onInputChange: (field: keyof AddressFormData, value: string) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ formData, onInputChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Address</h3>
      
      <div className="space-y-2">
        <Label htmlFor="street_address">Street Address</Label>
        <Input
          id="street_address"
          value={formData.street_address}
          onChange={(e) => onInputChange('street_address', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="street_address_line_2">Address Line 2 (Optional)</Label>
        <Input
          id="street_address_line_2"
          value={formData.street_address_line_2}
          onChange={(e) => onInputChange('street_address_line_2', e.target.value)}
          placeholder="Suite, Apt, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => onInputChange('state', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">Zip Code</Label>
        <Input
          id="zip_code"
          value={formData.zip_code}
          onChange={(e) => onInputChange('zip_code', e.target.value)}
          required
        />
      </div>
    </div>
  );
};

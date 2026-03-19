import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { BasicInfoForm } from '@/components/restaurant-profile-editor/BasicInfoForm';
import { AddressForm } from '@/components/restaurant-profile-editor/AddressForm';
import { LogoUpload } from '@/components/restaurant-profile-editor/LogoUpload';
import { useRestaurantMutations } from '@/components/restaurant-profile-editor/useRestaurantMutations';

interface Merchant {
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
}

interface PortalSettingsProps {
  merchant: Merchant;
}

export const PortalSettings: React.FC<PortalSettingsProps> = ({ merchant }) => {
  const navigate = useNavigate();
  const { updateRestaurantMutation } = useRestaurantMutations(merchant.id);
  const [logoUrl, setLogoUrl] = useState<string | null>(merchant.logo_url || null);

  const [formData, setFormData] = useState({
    restaurant_name: merchant.restaurant_name,
    street_address: merchant.street_address,
    street_address_line_2: merchant.street_address_line_2 || '',
    city: merchant.city,
    state: merchant.state,
    zip_code: merchant.zip_code,
    phone_number: merchant.phone_number || '',
    website: merchant.website || '',
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slugFieldsChanged =
      formData.restaurant_name !== merchant.restaurant_name ||
      formData.city !== merchant.city;

    try {
      const result = await updateRestaurantMutation.mutateAsync(formData);
      if (slugFieldsChanged && result?.slug) {
        navigate(`/merchant/${merchant.id}/manage`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Update your listing information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
          <CardContent>
            <BasicInfoForm
              formData={{ restaurant_name: formData.restaurant_name, phone_number: formData.phone_number, website: formData.website }}
              onInputChange={handleInputChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Address</CardTitle></CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Logo</CardTitle></CardHeader>
          <CardContent>
            <LogoUpload restaurantId={merchant.id} currentLogoUrl={logoUrl} onLogoUpdate={setLogoUrl} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateRestaurantMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateRestaurantMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { geocodeAllMerchants } from '@/utils/geocoding';
import { MapPin, Loader2 } from 'lucide-react';

export const GeocodingManager: React.FC = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleGeocodeAll = async () => {
    setIsGeocoding(true);
    setStatus('Starting geocoding process...');
    
    try {
      await geocodeAllMerchants();
      setStatus('Geocoding completed successfully!');
    } catch (error) {
      setStatus('Geocoding failed. Please try again.');
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Convert restaurant addresses to map coordinates for accurate pin placement.
        </p>
        
        <Button 
          onClick={handleGeocodeAll}
          disabled={isGeocoding}
          className="w-full"
        >
          {isGeocoding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Geocoding...
            </>
          ) : (
            'Geocode All Restaurants'
          )}
        </Button>
        
        {status && (
          <p className={`text-sm ${status.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

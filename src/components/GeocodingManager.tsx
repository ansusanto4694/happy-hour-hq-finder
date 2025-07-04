
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { geocodeAllMerchants } from '@/utils/geocoding';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const GeocodingManager: React.FC = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleGeocodeAll = async () => {
    setIsGeocoding(true);
    setStatus('Starting geocoding process...');
    setLastResult(null);
    
    try {
      const result = await geocodeAllMerchants();
      setLastResult(result);
      setStatus(result.message);
    } catch (error) {
      const errorMessage = 'Geocoding failed. Please try again.';
      setStatus(errorMessage);
      setLastResult({ success: false, message: errorMessage });
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
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
            lastResult?.success 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {lastResult?.success ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{status}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

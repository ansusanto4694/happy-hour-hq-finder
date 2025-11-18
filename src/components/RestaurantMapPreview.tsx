import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useParams } from 'react-router-dom';

interface RestaurantMapPreviewProps {
  latitude: number;
  longitude: number;
  restaurantName: string;
  address: string;
}

export const RestaurantMapPreview: React.FC<RestaurantMapPreviewProps> = ({
  latitude,
  longitude,
  restaurantName,
  address,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { track } = useAnalytics();
  const { id } = useParams();
  const merchantId = id ? parseInt(id, 10) : undefined;

  // Mapbox Static Images API URL
  // Using the same token as the rest of the app
  const mapboxToken = "pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw";
  const zoom = 15;
  const width = 700;
  const height = 500;
  
  // Using custom marker with amber color (f59e0b in hex)
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+f59e0b(${longitude},${latitude})/${longitude},${latitude},${zoom},0/${width}x${height}@2x?access_token=${mapboxToken}`;

  const handleMapClick = () => {
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    
    track({
      eventType: 'click',
      eventCategory: 'merchant_interaction',
      eventAction: 'map_preview_clicked',
      merchantId,
      metadata: {
        address,
        coordinates: { latitude, longitude },
      },
    });

    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    
    track({
      eventType: 'impression',
      eventCategory: 'merchant_interaction',
      eventAction: 'map_preview_viewed',
      merchantId,
    });
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load map preview');
  };

  if (imageError) {
    return null;
  }

  return (
    <div className="mb-6">
      <div 
        onClick={handleMapClick}
        className="relative overflow-hidden rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      >
        {!imageLoaded && (
          <Skeleton className="w-full h-[250px]" />
        )}
        
        <img
          src={staticMapUrl}
          alt={`Map showing location of ${restaurantName}`}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 px-4 py-2 rounded-md shadow-lg">
            <p className="text-sm font-medium text-foreground">Click to open in Google Maps</p>
          </div>
        </div>
      </div>
      
      {/* Address text below map */}
      <p className="mt-3 text-sm text-muted-foreground text-center">
        {address}
      </p>
    </div>
  );
};

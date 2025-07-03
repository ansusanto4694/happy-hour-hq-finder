
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  // We'll need to add lat/lng coordinates - for now using placeholder logic
}

interface ResultsMapProps {
  restaurants?: Restaurant[];
  onMapMove?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export const ResultsMap: React.FC<ResultsMapProps> = ({ 
  restaurants = [], 
  onMapMove 
}) => {
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });

  const mapRef = useRef<any>(null);

  // Handle map move events to update search results
  const handleMoveEnd = useCallback(() => {
    if (mapRef.current && onMapMove) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      
      onMapMove({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });
    }
  }, [onMapMove]);

  // Geocode function to convert addresses to coordinates (placeholder implementation)
  const getCoordinatesForRestaurant = (restaurant: Restaurant) => {
    // This is a placeholder - in production you'd want to either:
    // 1. Store lat/lng in your database
    // 2. Use a geocoding service to convert addresses to coordinates
    // For now, adding some variation around San Francisco
    const baseId = restaurant.id || 0;
    return {
      lng: -122.4194 + (baseId % 100) * 0.001 - 0.05,
      lat: 37.7749 + (baseId % 50) * 0.001 - 0.025
    };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Map View</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="rounded-lg overflow-hidden h-[calc(100vh-280px)] xl:h-[calc(100vh-240px)]">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onMoveEnd={handleMoveEnd}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken="pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw"
          >
            {/* Navigation Controls */}
            <NavigationControl position="top-right" />
            
            {/* Restaurant Markers */}
            {restaurants.map((restaurant) => {
              const coords = getCoordinatesForRestaurant(restaurant);
              return (
                <Marker
                  key={restaurant.id}
                  longitude={coords.lng}
                  latitude={coords.lat}
                  anchor="bottom"
                >
                  <div className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-red-600 transition-colors">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </Marker>
              );
            })}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
};

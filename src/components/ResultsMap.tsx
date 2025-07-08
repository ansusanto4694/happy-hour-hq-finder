
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MerchantMapPreviewCard } from '@/components/MerchantMapPreviewCard';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Restaurant {
  id: number;
  restaurant_name: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number | null;
  longitude?: number | null;
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

  const [hoveredRestaurant, setHoveredRestaurant] = useState<Restaurant | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<any>(null);
  const navigate = useNavigate();

  // Handle restaurant marker click
  const handleRestaurantClick = useCallback((restaurantId: number) => {
    navigate(`/restaurant/${restaurantId}`);
  }, [navigate]);

  // Handle marker hover
  const handleMarkerHover = useCallback((restaurant: Restaurant, event: React.MouseEvent) => {
    setHoveredRestaurant(restaurant);
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  // Handle marker leave
  const handleMarkerLeave = useCallback(() => {
    setHoveredRestaurant(null);
  }, []);

  // Update map center based on restaurants with coordinates
  useEffect(() => {
    const restaurantsWithCoords = restaurants.filter(
      restaurant => restaurant.latitude && restaurant.longitude
    );

    if (restaurantsWithCoords.length > 0) {
      // Calculate center point of all restaurants
      const avgLat = restaurantsWithCoords.reduce((sum, r) => sum + (r.latitude || 0), 0) / restaurantsWithCoords.length;
      const avgLng = restaurantsWithCoords.reduce((sum, r) => sum + (r.longitude || 0), 0) / restaurantsWithCoords.length;
      
      setViewState(prev => ({
        ...prev,
        latitude: avgLat,
        longitude: avgLng,
        zoom: 13
      }));
    }
  }, [restaurants]);

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
            
            {/* Restaurant Markers - Only show if coordinates exist */}
            {restaurants
              .filter(restaurant => restaurant.latitude && restaurant.longitude)
              .map((restaurant) => (
                <Marker
                  key={restaurant.id}
                  longitude={restaurant.longitude!}
                  latitude={restaurant.latitude!}
                  anchor="bottom"
                >
                  <div 
                    className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:bg-red-600 transition-colors"
                    title={restaurant.restaurant_name}
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    onMouseEnter={(event) => handleMarkerHover(restaurant, event)}
                    onMouseLeave={handleMarkerLeave}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </Marker>
              ))}
          </Map>
          
          {/* Merchant Preview Card */}
          <MerchantMapPreviewCard
            restaurant={hoveredRestaurant!}
            position={mousePosition}
            isVisible={!!hoveredRestaurant}
          />
        </div>
        
        {/* Show info about restaurants without coordinates */}
        {restaurants.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {restaurants.filter(r => r.latitude && r.longitude).length} of {restaurants.length} restaurants on map
          </div>
        )}
      </CardContent>
    </Card>
  );
};

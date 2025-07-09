
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MerchantMapPreviewCard } from '@/components/MerchantMapPreviewCard';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<any>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Handle restaurant marker click
  const handleRestaurantClick = useCallback((restaurant: Restaurant) => {
    if (isMobile) {
      // On mobile, show preview card at bottom instead of navigating
      setSelectedRestaurant(restaurant);
    } else {
      // On desktop, navigate directly
      navigate(`/restaurant/${restaurant.id}`);
    }
  }, [navigate, isMobile]);

  // Handle marker hover (desktop only)
  const handleMarkerHover = useCallback((restaurant: Restaurant, event: React.MouseEvent) => {
    if (isMobile) return; // Skip hover on mobile
    
    console.log('Marker hover triggered for:', restaurant.restaurant_name);
    
    // Get the map container's bounding rect for relative positioning
    const mapContainer = event.currentTarget.closest('.map-container');
    if (mapContainer) {
      const rect = mapContainer.getBoundingClientRect();
      const position = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
      };
      console.log('Mouse position:', position);
      setMousePosition(position);
    }
    setHoveredRestaurant(restaurant);
  }, [isMobile]);

  // Handle marker leave (desktop only)
  const handleMarkerLeave = useCallback(() => {
    if (isMobile) return; // Skip hover on mobile
    
    console.log('Marker leave triggered');
    setHoveredRestaurant(null);
  }, [isMobile]);

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
      <CardContent className="p-4 pt-0 relative">
        <div className="map-container rounded-lg overflow-hidden h-[calc(100vh-280px)] xl:h-[calc(100vh-240px)] relative">
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
                    onClick={() => handleRestaurantClick(restaurant)}
                    onMouseEnter={(event) => handleMarkerHover(restaurant, event)}
                    onMouseLeave={handleMarkerLeave}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </Marker>
              ))}
          </Map>
        </div>
        
        {/* Merchant Preview Card - positioned outside map container to avoid clipping */}
        <MerchantMapPreviewCard
          restaurant={isMobile ? selectedRestaurant! : hoveredRestaurant!}
          position={mousePosition}
          isVisible={isMobile ? !!selectedRestaurant : !!hoveredRestaurant}
          isMobile={isMobile}
          onNavigate={() => {
            if (selectedRestaurant) {
              navigate(`/restaurant/${selectedRestaurant.id}`);
            }
          }}
          onClose={() => setSelectedRestaurant(null)}
        />
        
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

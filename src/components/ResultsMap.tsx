
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MerchantMapPreviewCard } from '@/components/MerchantMapPreviewCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserLocation } from '@/hooks/useUserLocation';
import { Map as MapIcon, MapPin } from 'lucide-react';
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
  showSearchThisArea?: boolean;
  onSearchThisArea?: () => void;
  isUsingMapSearch?: boolean;
  viewState?: { longitude: number; latitude: number; zoom: number };
  onViewStateChange?: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
  isMobile?: boolean;
  hoveredRestaurantId?: number | null;
}

export const ResultsMap: React.FC<ResultsMapProps> = ({ 
  restaurants = [], 
  onMapMove,
  showSearchThisArea = false,
  onSearchThisArea,
  isUsingMapSearch = false,
  viewState: externalViewState,
  onViewStateChange,
  isMobile: mobileOverride,
  hoveredRestaurantId
}) => {
  const [viewState, setViewState] = useState(externalViewState || {
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12
  });

  const [hoveredRestaurant, setHoveredRestaurant] = useState<Restaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<any>(null);
  const navigate = useNavigate();
  const isMobile = mobileOverride ?? useIsMobile();
  const { userLocation } = useUserLocation();

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

  // Update map center based on restaurants with coordinates (only when not manually searching)
  useEffect(() => {
    // Skip automatic centering/zooming if user is using manual map search
    if (isUsingMapSearch) return;
    
    const restaurantsWithCoords = restaurants.filter(
      restaurant => restaurant.latitude && restaurant.longitude
    );

    if (restaurantsWithCoords.length > 0) {
      // Calculate center point of all restaurants
      const avgLat = restaurantsWithCoords.reduce((sum, r) => sum + (r.latitude || 0), 0) / restaurantsWithCoords.length;
      const avgLng = restaurantsWithCoords.reduce((sum, r) => sum + (r.longitude || 0), 0) / restaurantsWithCoords.length;
      
      const newViewState = {
        ...viewState,
        latitude: avgLat,
        longitude: avgLng,
        zoom: 13
      };
      
      setViewState(newViewState);
      // Notify parent of view state change
      onViewStateChange?.(newViewState);
    }
  }, [restaurants, isUsingMapSearch]);

  // Sync with external viewState when it changes
  useEffect(() => {
    if (externalViewState) {
      setViewState(externalViewState);
    }
  }, [externalViewState]);

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

  // Mobile full-screen map
  if (isMobile) {
    return (
      <div className="map-container h-full w-full relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => {
            const newViewState = evt.viewState;
            setViewState(newViewState);
            // Notify parent of view state change
            onViewStateChange?.(newViewState);
          }}
          onMoveEnd={handleMoveEnd}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken="pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw"
        >
          {/* No Navigation Controls on Mobile */}
          
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              longitude={userLocation.longitude}
              latitude={userLocation.latitude}
              anchor="center"
            >
              <div className="relative">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 bg-blue-500 rounded-full w-8 h-8 opacity-30 animate-ping"></div>
                {/* Inner blue dot */}
                <div className="bg-blue-500 rounded-full w-4 h-4 border-2 border-white shadow-lg relative z-10 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </Marker>
          )}
          
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
                    className={`rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all duration-200 ${
                      selectedRestaurant?.id === restaurant.id 
                        ? 'bg-blue-500 w-8 h-8 shadow-xl' 
                        : 'bg-red-500 w-6 h-6 active:bg-red-600'
                    }`}
                  title={restaurant.restaurant_name}
                  onClick={() => handleRestaurantClick(restaurant)}
                  onTouchStart={(event) => handleMarkerHover(restaurant, event as any)}
                  onTouchEnd={handleMarkerLeave}
                >
                  <div className={`bg-white rounded-full ${
                    selectedRestaurant?.id === restaurant.id ? 'w-3 h-3' : 'w-2 h-2'
                  }`}></div>
                </div>
              </Marker>
            ))}
        </Map>
        
        {/* Merchant Preview Card for mobile */}
        <MerchantMapPreviewCard
          restaurant={selectedRestaurant!}
          position={mousePosition}
          isVisible={!!selectedRestaurant}
          isMobile={isMobile}
          onNavigate={() => {
            if (selectedRestaurant) {
              navigate(`/restaurant/${selectedRestaurant.id}`);
            }
          }}
          onClose={() => setSelectedRestaurant(null)}
        />
      </div>
    );
  }

  // Desktop/tablet map with card wrapper
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Map View</CardTitle>
          {showSearchThisArea && onSearchThisArea && (
            <Button
              variant="default"
              size="sm"
              onClick={onSearchThisArea}
              className="flex items-center gap-2"
            >
              <MapIcon className="h-4 w-4" />
              Search this area
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 relative">
        <div className="map-container rounded-lg overflow-hidden h-[calc(100vh-280px)] xl:h-[calc(100vh-240px)] relative">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={evt => {
              const newViewState = evt.viewState;
              setViewState(newViewState);
              // Notify parent of view state change
              onViewStateChange?.(newViewState);
            }}
            onMoveEnd={handleMoveEnd}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken="pk.eyJ1IjoiYW5zdXNhbnRvNDY5NCIsImEiOiJjbWNudDdob28weTZlMmtxMTBmbDc5YTM4In0.qwR9SIqDBrETlROMvhnKvw"
          >
            {/* Navigation Controls */}
            <NavigationControl position="top-right" />
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                longitude={userLocation.longitude}
                latitude={userLocation.latitude}
                anchor="center"
              >
                <div className="relative">
                  {/* Outer pulse ring */}
                  <div className="absolute inset-0 bg-blue-500 rounded-full w-8 h-8 opacity-30 animate-ping"></div>
                  {/* Inner blue dot */}
                  <div className="bg-blue-500 rounded-full w-4 h-4 border-2 border-white shadow-lg relative z-10 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </Marker>
            )}
            
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
                    className={`rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-colors ${
                      hoveredRestaurantId === restaurant.id 
                        ? 'bg-[#BF40BF] hover:bg-[#A030A0]' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
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
          restaurant={hoveredRestaurant!}
          position={mousePosition}
          isVisible={!!hoveredRestaurant}
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

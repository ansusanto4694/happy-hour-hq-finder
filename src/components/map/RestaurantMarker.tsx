import React from 'react';
import { Marker } from 'react-map-gl';

interface Restaurant {
  id: number;
  restaurant_name: string;
  longitude: number;
  latitude: number;
}

interface RestaurantMarkerProps {
  restaurant: Restaurant;
  isHovered: boolean;
  isSelected: boolean;
  isMobile: boolean;
  onClick: () => void;
  onMouseEnter?: (event: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

/**
 * Memoized restaurant marker component to prevent unnecessary re-renders
 * Only re-renders when the specific marker's state changes
 */
const RestaurantMarkerComponent: React.FC<RestaurantMarkerProps> = ({
  restaurant,
  isHovered,
  isSelected,
  isMobile,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Determine the visual state
  const isHighlighted = isMobile ? isSelected : isHovered;
  
  return (
    <Marker
      longitude={restaurant.longitude}
      latitude={restaurant.latitude}
      anchor="bottom"
      style={{
        zIndex: isHighlighted ? 1000 : 1
      }}
    >
      <div 
        className={`rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all duration-300 ${
          isHighlighted 
            ? isMobile 
              ? 'bg-blue-500 w-8 h-8 shadow-xl' 
              : 'bg-bright-blue hover:bg-bright-blue/80 w-9 h-9 scale-110'
            : isMobile
              ? 'bg-red-500 w-6 h-6 active:bg-red-600'
              : 'bg-red-500 hover:bg-red-600 w-6 h-6 scale-100'
        }`}
        title={restaurant.restaurant_name}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className={`bg-white rounded-full ${
          isHighlighted && isMobile ? 'w-3 h-3' : 'w-2 h-2'
        }`}></div>
      </div>
    </Marker>
  );
};

// Memoized with custom comparison - only re-render when marker state actually changes
export const RestaurantMarker = React.memo(RestaurantMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.restaurant.id === nextProps.restaurant.id &&
    prevProps.restaurant.longitude === nextProps.restaurant.longitude &&
    prevProps.restaurant.latitude === nextProps.restaurant.latitude &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isMobile === nextProps.isMobile
    // Callbacks are excluded from comparison since they're stable with useCallback
  );
});

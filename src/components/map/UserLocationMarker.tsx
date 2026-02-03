import React from 'react';
import { Marker } from 'react-map-gl';

interface UserLocationMarkerProps {
  longitude: number;
  latitude: number;
}

/**
 * Memoized user location marker with pulsing animation
 */
const UserLocationMarkerComponent: React.FC<UserLocationMarkerProps> = ({
  longitude,
  latitude,
}) => {
  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
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
  );
};

export const UserLocationMarker = React.memo(UserLocationMarkerComponent, (prevProps, nextProps) => {
  return (
    prevProps.longitude === nextProps.longitude &&
    prevProps.latitude === nextProps.latitude
  );
});

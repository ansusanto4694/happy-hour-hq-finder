import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { throttle, shouldSampleEvent, getDeviceType } from '@/utils/analytics';

interface MapInteractionTrackerProps {
  mapRef: React.RefObject<any>;
  merchantId?: number;
}

/**
 * Component to track map interactions with throttling and sampling
 * Attaches to map instance and tracks zoom, pan, and marker clicks
 */
export const MapInteractionTracker: React.FC<MapInteractionTrackerProps> = ({
  mapRef,
  merchantId,
}) => {
  const { track } = useAnalytics();
  const trackingSetupRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map || trackingSetupRef.current) return;

    trackingSetupRef.current = true;

    // Throttled zoom tracking (sample 50% of zoom events)
    const handleZoomEnd = throttle(
      () => {
        if (shouldSampleEvent(0.5)) {
          const zoom = map.getZoom();
          track({
            eventType: 'interaction',
            eventCategory: 'map_interaction',
            eventAction: 'map_zoom',
            eventLabel: zoom.toFixed(2),
            merchantId,
            metadata: { zoom: zoom.toFixed(2) },
          });
        }
      },
      'map_zoom',
      2000 // 2 second throttle
    );

    // Throttled pan tracking (sample 30% of pan events)
    const handleMoveEnd = throttle(
      () => {
        if (shouldSampleEvent(0.3)) {
          const center = map.getCenter();
          track({
            eventType: 'interaction',
            eventCategory: 'map_interaction',
            eventAction: 'map_pan',
            merchantId,
            metadata: {
              lat: center.lat.toFixed(4),
              lng: center.lng.toFixed(4),
            },
          });
        }
      },
      'map_pan',
      3000 // 3 second throttle
    );

    // Track marker clicks (100% - high value events)
    const handleClick = (e: any) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['restaurant-markers'],
      });

      if (features.length > 0) {
        const feature = features[0];
        track({
          eventType: 'click',
          eventCategory: 'map_interaction',
          eventAction: 'map_marker_clicked',
          merchantId: feature.properties?.id,
          eventLabel: feature.properties?.name,
          metadata: {
            deviceType: getDeviceType(),
            position: {
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0],
            },
          },
        });
      }
    };

    // Attach event listeners
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    map.on('click', handleClick);

    // Cleanup
    return () => {
      if (map) {
        map.off('zoomend', handleZoomEnd);
        map.off('moveend', handleMoveEnd);
        map.off('click', handleClick);
      }
    };
  }, [mapRef, track, merchantId]);

  return null; // This is a tracking-only component
};

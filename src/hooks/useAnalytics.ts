import { useEffect, useCallback, useRef } from 'react';
import {
  initializeSession,
  trackEvent,
  trackPageView,
  trackFunnelStep,
  trackClick,
  type TrackEventParams,
  type FunnelStep,
} from '@/utils/analytics';

// Global flag to ensure session initialization happens only once per app load
let globalSessionInitialized = false;

export const useAnalytics = () => {
  const sessionInitializedRef = useRef(false);

  // Initialize session only once per app load
  useEffect(() => {
    if (!globalSessionInitialized && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      globalSessionInitialized = true;
      initializeSession();
    }
  }, []);

  // Memoize all analytics functions with empty dependency arrays for maximum performance
  const track = useCallback((params: TrackEventParams) => {
    trackEvent(params);
  }, []);

  const trackPage = useCallback((additionalParams?: Partial<TrackEventParams>) => {
    trackPageView(additionalParams);
  }, []);

  const trackFunnel = useCallback((params: FunnelStep) => {
    trackFunnelStep(params);
  }, []);

  const trackElementClick = useCallback(
    (
      element: HTMLElement,
      category: TrackEventParams['eventCategory'],
      action: string,
      additionalParams?: Partial<TrackEventParams>
    ) => {
      trackClick(element, category, action, additionalParams);
    },
    []
  );

  return {
    track,
    trackPage,
    trackFunnel,
    trackElementClick,
  };
};

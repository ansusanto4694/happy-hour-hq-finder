import { useEffect, useCallback, useRef } from 'react';
import {
  initializeSession,
  trackEvent,
  trackPageView,
  trackFunnelStep,
  trackClick,
  verifyGA4Setup,
  enableGA4Debug,
  type TrackEventParams,
  type FunnelStep,
} from '@/utils/analytics';

// Global flag to ensure session initialization happens only once per app load
let globalSessionInitialized = false;

// Helper to defer initialization until after first paint
const deferExecution = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 100);
  }
};

export const useAnalytics = () => {
  const sessionInitializedRef = useRef(false);

  // Initialize session only once per app load, deferred for better Core Web Vitals
  useEffect(() => {
    if (!globalSessionInitialized && !sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      globalSessionInitialized = true;
      
      // Defer analytics initialization to not block first paint
      deferExecution(() => {
        initializeSession();
        
        // Verify GA4 setup on initialization
        verifyGA4Setup();
        
        // Enable debug mode in development
        if (import.meta.env.DEV) {
          enableGA4Debug();
        }
      });
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
    verifyGA4Setup,
    enableGA4Debug,
  };
};

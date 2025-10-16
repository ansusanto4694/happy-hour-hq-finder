import { useEffect, useCallback } from 'react';
import {
  initializeSession,
  trackEvent,
  trackPageView,
  trackFunnelStep,
  trackClick,
  type TrackEventParams,
  type FunnelStep,
} from '@/utils/analytics';

export const useAnalytics = () => {
  // Initialize session on mount
  useEffect(() => {
    initializeSession();
  }, []);

  const track = useCallback(async (params: TrackEventParams) => {
    await trackEvent(params);
  }, []);

  const trackPage = useCallback(async (additionalParams?: Partial<TrackEventParams>) => {
    await trackPageView(additionalParams);
  }, []);

  const trackFunnel = useCallback(async (params: FunnelStep) => {
    await trackFunnelStep(params);
  }, []);

  const trackElementClick = useCallback(
    async (
      element: HTMLElement,
      category: TrackEventParams['eventCategory'],
      action: string,
      additionalParams?: Partial<TrackEventParams>
    ) => {
      await trackClick(element, category, action, additionalParams);
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

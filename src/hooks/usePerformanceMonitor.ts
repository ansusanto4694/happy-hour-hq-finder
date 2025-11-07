import { useEffect, useRef } from 'react';
import { measureComponentRender } from '@/utils/performanceMonitoring';

/**
 * Hook to monitor component render performance
 * Automatically tracks render time and logs slow renders in development
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());

  useEffect(() => {
    measureComponentRender(componentName, renderStartTime.current);
  });

  return {
    startMeasure: () => {
      renderStartTime.current = performance.now();
    },
  };
};

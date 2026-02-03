import { useEffect, useRef, useCallback } from 'react';

// Singleton shared IntersectionObserver for all result cards
// This dramatically reduces memory usage and improves scroll performance
// by using a single observer instance instead of one per card

type OnVisibleCallback = () => void;

interface ObservedElement {
  callback: OnVisibleCallback;
  hasTriggered: boolean;
}

// Map to track observed elements and their callbacks
const observedElements = new Map<Element, ObservedElement>();

// Single shared IntersectionObserver instance
let sharedObserver: IntersectionObserver | null = null;

// Initialize the shared observer (lazy initialization)
const getSharedObserver = (): IntersectionObserver => {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const observed = observedElements.get(entry.target);
            if (observed && !observed.hasTriggered) {
              // Mark as triggered to prevent duplicate callbacks
              observed.hasTriggered = true;
              // Execute the callback
              observed.callback();
              // Unobserve since we only need one impression per element
              sharedObserver?.unobserve(entry.target);
              observedElements.delete(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% visibility before triggering
        rootMargin: '0px',
      }
    );
  }
  return sharedObserver;
};

// Register an element for observation
export const observeElement = (element: Element, onVisible: OnVisibleCallback): void => {
  if (observedElements.has(element)) {
    return; // Already observing this element
  }

  observedElements.set(element, {
    callback: onVisible,
    hasTriggered: false,
  });

  getSharedObserver().observe(element);
};

// Unregister an element from observation
export const unobserveElement = (element: Element): void => {
  if (observedElements.has(element)) {
    sharedObserver?.unobserve(element);
    observedElements.delete(element);
  }
};

// Hook for components to use the shared observer
export const useSharedIntersectionObserver = (
  onVisible: OnVisibleCallback,
  enabled: boolean = true
) => {
  const elementRef = useRef<HTMLElement | null>(null);
  const callbackRef = useRef(onVisible);

  // Keep callback ref updated
  callbackRef.current = onVisible;

  // Stable callback that uses ref
  const stableCallback = useCallback(() => {
    callbackRef.current();
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    observeElement(element, stableCallback);

    return () => {
      if (element) {
        unobserveElement(element);
      }
    };
  }, [enabled, stableCallback]);

  return elementRef;
};

// Cleanup function to reset observer (useful for testing)
export const resetSharedObserver = (): void => {
  if (sharedObserver) {
    sharedObserver.disconnect();
    sharedObserver = null;
  }
  observedElements.clear();
};

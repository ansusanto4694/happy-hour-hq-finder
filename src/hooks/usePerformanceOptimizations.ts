import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 */
export const useDebounce = (callback: (...args: any[]) => void, delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedCallback, cancel };
};

/**
 * Custom hook for throttling function calls
 */
export const useThrottle = (callback: (...args: any[]) => void, delay: number = 300) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback((...args: any[]) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      lastCallRef.current = now;
      callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);

  return throttledCallback;
};

/**
 * Custom hook for optimized search state management
 */
export const useOptimizedSearch = () => {
  const searchCacheRef = useRef(new Map<string, any>());
  
  const getCachedResult = useCallback((key: string) => {
    return searchCacheRef.current.get(key);
  }, []);
  
  const setCachedResult = useCallback((key: string, result: any) => {
    // Limit cache size to prevent memory leaks
    if (searchCacheRef.current.size > 100) {
      const firstKey = searchCacheRef.current.keys().next().value;
      searchCacheRef.current.delete(firstKey);
    }
    searchCacheRef.current.set(key, result);
  }, []);
  
  const clearCache = useCallback(() => {
    searchCacheRef.current.clear();
  }, []);
  
  return { getCachedResult, setCachedResult, clearCache };
};
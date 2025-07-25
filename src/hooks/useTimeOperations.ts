/**
 * Performance-optimized time utilities hook
 * Provides memoized time operations and caching for better performance
 */

import { useMemo, useCallback, useRef } from 'react';
import { 
  formatTime, 
  getTodaysHappyHour, 
  timeToMinutes, 
  getDayName,
  formatAllHappyHours,
  type HappyHour 
} from '@/utils/timeUtils';

/**
 * Custom hook for optimized time operations with caching
 */
export const useTimeOperations = () => {
  const formatCache = useRef(new Map<string, string>());
  const dayNameCache = useRef(new Map<number, string>());

  // Memoized and cached time formatting
  const formatTimeCached = useCallback((timeString: string): string => {
    if (!timeString) return '';
    
    if (formatCache.current.has(timeString)) {
      return formatCache.current.get(timeString)!;
    }

    const formatted = formatTime(timeString);
    
    // Limit cache size to prevent memory leaks
    if (formatCache.current.size > 100) {
      const firstKey = formatCache.current.keys().next().value;
      formatCache.current.delete(firstKey);
    }
    
    formatCache.current.set(timeString, formatted);
    return formatted;
  }, []);

  // Memoized and cached day name lookup
  const getDayNameCached = useCallback((dayNumber: number): string => {
    if (dayNameCache.current.has(dayNumber)) {
      return dayNameCache.current.get(dayNumber)!;
    }

    const dayName = getDayName(dayNumber);
    dayNameCache.current.set(dayNumber, dayName);
    return dayName;
  }, []);

  // Clear caches when needed
  const clearCaches = useCallback(() => {
    formatCache.current.clear();
    dayNameCache.current.clear();
  }, []);

  return {
    formatTime: formatTimeCached,
    getDayName: getDayNameCached,
    getTodaysHappyHour,
    timeToMinutes,
    formatAllHappyHours,
    clearCaches
  };
};

/**
 * Hook for optimized happy hour operations
 */
export const useHappyHourOperations = (happyHours: HappyHour[] = []) => {
  // Memoize today's happy hour calculation
  const todaysHappyHour = useMemo(() => {
    return getTodaysHappyHour(happyHours);
  }, [happyHours]);

  // Memoize formatted happy hours
  const formattedHappyHours = useMemo(() => {
    return formatAllHappyHours(happyHours);
  }, [happyHours]);

  // Memoize validation
  const hasValidHappyHours = useMemo(() => {
    return Array.isArray(happyHours) && happyHours.length > 0;
  }, [happyHours]);

  return {
    todaysHappyHour,
    formattedHappyHours,
    hasValidHappyHours,
    happyHoursCount: happyHours.length
  };
};
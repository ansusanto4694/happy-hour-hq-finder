/**
 * Time-based filtering utilities for merchants and happy hours
 * Optimized for performance and maintainability
 */

import { 
  timeToMinutes, 
  doesHappyHourOverlap, 
  isValidHappyHour,
  type HappyHour 
} from './timeUtils';

// ============================================================================
// MERCHANT FILTERING
// ============================================================================

/**
 * Filter merchants by time range with enhanced performance and error handling
 */
export const filterMerchantsByTime = (
  merchants: any[], 
  startTime: string, 
  endTime: string
): any[] => {
  console.log('=== TIME FILTERING DEBUG ===');
  console.log('Input startTime:', startTime, 'endTime:', endTime);
  console.log('Input merchants count:', merchants?.length || 0);
  console.log('Applying optimized time filtering:', startTime, 'to', endTime);
  
  // Validate inputs
  if (!Array.isArray(merchants) || !startTime || !endTime) {
    console.warn('Invalid inputs for time filtering');
    return [];
  }

  // Pre-calculate time ranges for efficiency
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  console.log('Converted times - startMinutes:', startMinutes, 'endMinutes:', endMinutes);
  
  if (startMinutes === 0 && endMinutes === 0) {
    console.warn('Invalid time range for filtering');
    return [];
  }

  let processedCount = 0;
  let matchedCount = 0;

  const filteredMerchants = merchants.filter(merchant => {
    processedCount++;
    
    // Validate merchant structure
    if (!merchant?.merchant_happy_hour || !Array.isArray(merchant.merchant_happy_hour)) {
      return false;
    }

    // Check if any happy hour overlaps with the specified time range
    const hasOverlap = merchant.merchant_happy_hour.some((hh: any) => {
      // Validate happy hour structure
      if (!isValidHappyHour(hh)) {
        return false;
      }

      try {
        // Use optimized overlap check
        const hhStartMinutes = timeToMinutes(hh.happy_hour_start);
        const hhEndMinutes = timeToMinutes(hh.happy_hour_end);

        // Log detailed comparison for debugging
        if (merchant.restaurant_name) {
          console.log(
            `Checking ${merchant.restaurant_name}: ` +
            `User time ${startTime}-${endTime} (${startMinutes}-${endMinutes} min) ` +
            `vs HH ${hh.happy_hour_start}-${hh.happy_hour_end} (${hhStartMinutes}-${hhEndMinutes} min)`
          );
        }

        // Check if happy hour overlaps with user's specified time window
        return hhStartMinutes < endMinutes && hhEndMinutes > startMinutes;
      } catch (error) {
        console.warn('Error processing happy hour:', error, hh);
        return false;
      }
    });

    if (hasOverlap) {
      matchedCount++;
    }

    return hasOverlap;
  });

  console.log(`Time filtering completed: ${matchedCount}/${processedCount} merchants matched`);
  return filteredMerchants;
};

/**
 * Filter merchants by specific day and time range
 */
export const filterMerchantsByDayAndTime = (
  merchants: any[],
  dayOfWeek: number,
  startTime: string,
  endTime: string
): any[] => {
  console.log(`Filtering merchants for day ${dayOfWeek} between ${startTime}-${endTime}`);
  
  if (!Array.isArray(merchants) || dayOfWeek < 0 || dayOfWeek > 6) {
    return [];
  }

  return merchants.filter(merchant => {
    if (!merchant?.merchant_happy_hour || !Array.isArray(merchant.merchant_happy_hour)) {
      return false;
    }

    return merchant.merchant_happy_hour.some((hh: HappyHour) => {
      return (
        isValidHappyHour(hh) &&
        hh.day_of_week === dayOfWeek &&
        doesHappyHourOverlap([hh], startTime, endTime, dayOfWeek)
      );
    });
  });
};

/**
 * Filter merchants that have happy hours on specific days
 */
export const filterMerchantsByDays = (
  merchants: any[],
  daysOfWeek: number[]
): any[] => {
  if (!Array.isArray(merchants) || !Array.isArray(daysOfWeek)) {
    return [];
  }

  const daySet = new Set(daysOfWeek);

  return merchants.filter(merchant => {
    if (!merchant?.merchant_happy_hour || !Array.isArray(merchant.merchant_happy_hour)) {
      return false;
    }

    return merchant.merchant_happy_hour.some((hh: HappyHour) => {
      return isValidHappyHour(hh) && daySet.has(hh.day_of_week);
    });
  });
};

// ============================================================================
// HAPPY HOUR ANALYSIS
// ============================================================================

/**
 * Get unique days when merchants have happy hours
 */
export const getActiveDaysFromMerchants = (merchants: any[]): number[] => {
  const activeDays = new Set<number>();

  merchants.forEach(merchant => {
    if (merchant?.merchant_happy_hour && Array.isArray(merchant.merchant_happy_hour)) {
      merchant.merchant_happy_hour.forEach((hh: HappyHour) => {
        if (isValidHappyHour(hh)) {
          activeDays.add(hh.day_of_week);
        }
      });
    }
  });

  return Array.from(activeDays).sort();
};

/**
 * Get time statistics for merchants' happy hours
 */
export const getHappyHourStats = (merchants: any[]): {
  totalMerchants: number;
  merchantsWithHappyHours: number;
  averageHappyHours: number;
  mostPopularDay: number | null;
  earliestStart: string | null;
  latestEnd: string | null;
} => {
  let merchantsWithHappyHours = 0;
  let totalHappyHours = 0;
  const dayCount: Record<number, number> = {};
  let earliestStartMinutes = Infinity;
  let latestEndMinutes = -1;
  let earliestStart: string | null = null;
  let latestEnd: string | null = null;

  merchants.forEach(merchant => {
    if (merchant?.merchant_happy_hour && Array.isArray(merchant.merchant_happy_hour)) {
      const validHappyHours = merchant.merchant_happy_hour.filter(isValidHappyHour);
      
      if (validHappyHours.length > 0) {
        merchantsWithHappyHours++;
        totalHappyHours += validHappyHours.length;

        validHappyHours.forEach((hh: HappyHour) => {
          // Count days
          dayCount[hh.day_of_week] = (dayCount[hh.day_of_week] || 0) + 1;

          // Track earliest/latest times
          const startMinutes = timeToMinutes(hh.happy_hour_start);
          const endMinutes = timeToMinutes(hh.happy_hour_end);

          if (startMinutes < earliestStartMinutes) {
            earliestStartMinutes = startMinutes;
            earliestStart = hh.happy_hour_start;
          }

          if (endMinutes > latestEndMinutes) {
            latestEndMinutes = endMinutes;
            latestEnd = hh.happy_hour_end;
          }
        });
      }
    }
  });

  // Find most popular day
  const mostPopularDay = Object.keys(dayCount).reduce((a, b) => 
    dayCount[parseInt(a)] > dayCount[parseInt(b)] ? a : b, 
    null
  );

  return {
    totalMerchants: merchants.length,
    merchantsWithHappyHours,
    averageHappyHours: merchantsWithHappyHours > 0 ? totalHappyHours / merchantsWithHappyHours : 0,
    mostPopularDay: mostPopularDay ? parseInt(mostPopularDay) : null,
    earliestStart,
    latestEnd
  };
};

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process merchants in batches for better performance with large datasets
 */
export const filterMerchantsByTimeBatched = (
  merchants: any[],
  startTime: string,
  endTime: string,
  batchSize: number = 100
): Promise<any[]> => {
  return new Promise((resolve) => {
    const results: any[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      const batch = merchants.slice(currentIndex, currentIndex + batchSize);
      const filteredBatch = filterMerchantsByTime(batch, startTime, endTime);
      results.push(...filteredBatch);

      currentIndex += batchSize;

      if (currentIndex < merchants.length) {
        // Use setTimeout to avoid blocking the main thread
        setTimeout(processBatch, 0);
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
};
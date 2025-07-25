/**
 * Comprehensive Time Utilities
 * Consolidated time-related functions for consistent handling across the application
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HappyHour {
  id?: string;
  day_of_week: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface ParsedTime {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
] as const;

export const HOURS_12 = [
  '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
] as const;

// ============================================================================
// CORE TIME PARSING & CONVERSION
// ============================================================================

/**
 * Parse a time string and convert to minutes since midnight
 * Handles both 12-hour (with AM/PM) and 24-hour formats
 */
export const timeToMinutes = (timeStr: string): number => {
  console.log('timeToMinutes called with:', timeStr);
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn('Invalid time string provided to timeToMinutes:', timeStr);
    return 0;
  }

  const trimmedTime = timeStr.trim();
  const parts = trimmedTime.split(':');
  
  if (parts.length < 2) {
    console.warn('Invalid time format, expected HH:MM:', timeStr);
    return 0;
  }

  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1].split(' ')[0]); // Handle "00 PM" format

  // Validate parsed numbers
  if (isNaN(hours) || isNaN(minutes)) {
    console.warn('Invalid time components in:', timeStr);
    return 0;
  }

  // Handle 12-hour format with AM/PM
  const upperTime = trimmedTime.toUpperCase();
  if (upperTime.includes('PM') && hours !== 12) {
    hours += 12;
  } else if (upperTime.includes('AM') && hours === 12) {
    hours = 0;
  }

  // Validate final hours and minutes
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn('Time components out of valid range:', { hours, minutes, original: timeStr });
    return 0;
  }

  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to a ParsedTime object
 */
export const minutesToTime = (totalMinutes: number): ParsedTime => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    hours,
    minutes,
    totalMinutes
  };
};

/**
 * Convert 24-hour time to database format (HH:MM)
 */
export const to24HourFormat = (timeStr: string): string => {
  const minutes = timeToMinutes(timeStr);
  const { hours, minutes: mins } = minutesToTime(minutes);
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format a time string for display (12-hour format with AM/PM)
 * Optimized version with error handling
 */
export const formatTime = (timeString: string): string => {
  if (!timeString || typeof timeString !== 'string') {
    return '';
  }

  try {
    // Handle database format (HH:MM) or full datetime
    const timeOnly = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    const [hours, minutes] = timeOnly.split(':').map(part => part?.trim()).filter(Boolean);
    
    if (!hours || !minutes) {
      throw new Error('Invalid time format');
    }

    const time = new Date(`1970-01-01T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
    
    if (isNaN(time.getTime())) {
      throw new Error('Invalid date created from time string');
    }

    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.warn('Error formatting time:', timeString, error);
    return timeString; // Return original string as fallback
  }
};

/**
 * Format time with additional options
 */
export const formatTimeAdvanced = (
  timeString: string, 
  options: {
    showSeconds?: boolean;
    use24Hour?: boolean;
    compact?: boolean;
  } = {}
): string => {
  const { showSeconds = false, use24Hour = false, compact = false } = options;
  
  if (!timeString) return '';

  try {
    const timeOnly = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    const [hours, minutes, seconds = '00'] = timeOnly.split(':');
    
    const time = new Date(`1970-01-01T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`);
    
    return time.toLocaleTimeString('en-US', { 
      hour: compact ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: !use24Hour
    });
  } catch (error) {
    return timeString;
  }
};

// ============================================================================
// DAY UTILITIES
// ============================================================================

/**
 * Get day name from day number (0-6, where 0 = Monday)
 */
export const getDayName = (dayNumber: number): string => {
  if (dayNumber < 0 || dayNumber >= DAYS_OF_WEEK.length) {
    console.warn('Invalid day number:', dayNumber);
    return '';
  }
  return DAYS_OF_WEEK[dayNumber];
};

/**
 * Get current day of week in our format (0 = Monday, 6 = Sunday)
 */
export const getCurrentDayOfWeek = (): number => {
  const today = new Date().getDay();
  // Convert JavaScript day (0 = Sunday) to our format (0 = Monday)
  return today === 0 ? 6 : today - 1;
};

/**
 * Get day number from day name
 */
export const getDayNumber = (dayName: string): number => {
  const index = DAYS_OF_WEEK.findIndex(day => 
    day.toLowerCase() === dayName.toLowerCase()
  );
  return index;
};

// ============================================================================
// HAPPY HOUR UTILITIES
// ============================================================================

/**
 * Get today's happy hour information with enhanced error handling
 */
export const getTodaysHappyHour = (happyHours: HappyHour[] = []): string => {
  if (!Array.isArray(happyHours) || happyHours.length === 0) {
    return 'No Happy Hour Today';
  }

  const today = getCurrentDayOfWeek();
  
  try {
    const todaysHour = happyHours.find(hh => 
      hh && typeof hh.day_of_week === 'number' && hh.day_of_week === today
    );
    
    if (todaysHour?.happy_hour_start && todaysHour?.happy_hour_end) {
      const startTime = formatTime(todaysHour.happy_hour_start);
      const endTime = formatTime(todaysHour.happy_hour_end);
      
      if (startTime && endTime) {
        return `${startTime} - ${endTime}`;
      }
    }
  } catch (error) {
    console.warn('Error getting today\'s happy hour:', error);
  }
  
  return 'No Happy Hour Today';
};

/**
 * Get all happy hours formatted for display
 */
export const formatAllHappyHours = (happyHours: HappyHour[] = []): Array<{
  day: string;
  time: string;
  dayNumber: number;
}> => {
  if (!Array.isArray(happyHours)) {
    return [];
  }

  return happyHours
    .filter(hh => hh && typeof hh.day_of_week === 'number')
    .map(hh => ({
      day: getDayName(hh.day_of_week),
      time: `${formatTime(hh.happy_hour_start)} - ${formatTime(hh.happy_hour_end)}`,
      dayNumber: hh.day_of_week
    }))
    .sort((a, b) => a.dayNumber - b.dayNumber);
};

/**
 * Check if a merchant's happy hours overlap with a given time range
 */
export const doesHappyHourOverlap = (
  happyHours: HappyHour[] = [],
  startTime: string,
  endTime: string,
  targetDay?: number
): boolean => {
  if (!Array.isArray(happyHours) || !startTime || !endTime) {
    return false;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  if (startMinutes === 0 && endMinutes === 0) {
    return false; // Invalid time range
  }

  const dayToCheck = targetDay !== undefined ? targetDay : getCurrentDayOfWeek();

  return happyHours.some(hh => {
    if (!hh || hh.day_of_week !== dayToCheck) {
      return false;
    }

    try {
      const hhStartMinutes = timeToMinutes(hh.happy_hour_start);
      const hhEndMinutes = timeToMinutes(hh.happy_hour_end);
      
      // Check if time ranges overlap
      return hhStartMinutes < endMinutes && hhEndMinutes > startMinutes;
    } catch (error) {
      console.warn('Error checking happy hour overlap:', error);
      return false;
    }
  });
};

// ============================================================================
// TIME RANGE UTILITIES
// ============================================================================

/**
 * Check if two time ranges overlap
 */
export const timeRangesOverlap = (
  range1: TimeRange,
  range2: TimeRange
): boolean => {
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);
  
  return start1 < end2 && end1 > start2;
};

/**
 * Calculate duration between two times in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  if (end < start) {
    // Handle overnight duration (crosses midnight)
    return (24 * 60) - start + end;
  }
  
  return end - start;
};

/**
 * Format duration in human-readable format
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate time string format
 */
export const isValidTimeString = (timeStr: string): boolean => {
  if (!timeStr || typeof timeStr !== 'string') {
    return false;
  }

  // Check for basic HH:MM format (with optional AM/PM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(\s?(AM|PM))?$/i;
  return timeRegex.test(timeStr.trim());
};

/**
 * Validate happy hour object
 */
export const isValidHappyHour = (hh: any): hh is HappyHour => {
  return (
    hh &&
    typeof hh.day_of_week === 'number' &&
    hh.day_of_week >= 0 &&
    hh.day_of_week <= 6 &&
    typeof hh.happy_hour_start === 'string' &&
    typeof hh.happy_hour_end === 'string' &&
    isValidTimeString(hh.happy_hour_start) &&
    isValidTimeString(hh.happy_hour_end)
  );
};
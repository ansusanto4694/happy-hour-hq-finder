
// Helper function to get day name from day number
export const getDayName = (dayNumber: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber] || '';
};

// Helper function to format time
export const formatTime = (timeString: string): string => {
  const time = new Date(`1970-01-01T${timeString}`);
  return time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to get today's happy hour (first one only for badge)
export const getTodaysHappyHour = (happyHours: any[]): string => {
  const today = new Date().getDay();
  // Convert Sunday (0) to our format (6), and adjust other days
  const adjustedToday = today === 0 ? 6 : today - 1;
  
  const todaysHour = happyHours.find(hh => hh.day_of_week === adjustedToday);
  if (todaysHour) {
    return `${formatTime(todaysHour.happy_hour_start)} - ${formatTime(todaysHour.happy_hour_end)}`;
  }
  return 'No Happy Hour Today';
};

// Helper function to get ALL happy hours for today, sorted by start time
export const getAllTodaysHappyHours = (happyHours: any[]): Array<{ start: string; end: string }> => {
  const today = new Date().getDay();
  // Convert Sunday (0) to our format (6), and adjust other days
  const adjustedToday = today === 0 ? 6 : today - 1;
  
  const todaysHours = happyHours.filter(hh => hh.day_of_week === adjustedToday);
  
  // Sort by start time
  todaysHours.sort((a, b) => {
    const timeA = a.happy_hour_start.split(':').map(Number);
    const timeB = b.happy_hour_start.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });
  
  return todaysHours.map(hh => ({
    start: formatTime(hh.happy_hour_start),
    end: formatTime(hh.happy_hour_end)
  }));
};

// Helper function to get menu type badge from happy hour deals
export const getMenuTypeBadge = (deals: any[]) => {
  const activeDealMenuTypes = deals
    ?.filter(deal => deal.active)
    .map(deal => deal.menu_type)
    .filter(Boolean);
  
  if (!activeDealMenuTypes || activeDealMenuTypes.length === 0) {
    return null;
  }
  
  // If any deal has food and drinks, prioritize that
  if (activeDealMenuTypes.includes('food_and_drinks')) {
    return { type: 'food_and_drinks', emoji: '🍽️', label: 'Food & Drinks' };
  }
  
  // Otherwise, if all are drinks only
  if (activeDealMenuTypes.includes('drinks_only')) {
    return { type: 'drinks_only', emoji: '🥃', label: 'Drinks Only' };
  }
  
  return null;
};


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

// Helper function to get ALL happy hours for today
export const getAllTodaysHappyHours = (happyHours: any[]): Array<{ start: string; end: string }> => {
  const today = new Date().getDay();
  // Convert Sunday (0) to our format (6), and adjust other days
  const adjustedToday = today === 0 ? 6 : today - 1;
  
  const todaysHours = happyHours.filter(hh => hh.day_of_week === adjustedToday);
  return todaysHours.map(hh => ({
    start: formatTime(hh.happy_hour_start),
    end: formatTime(hh.happy_hour_end)
  }));
};

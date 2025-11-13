
import React from 'react';
import { Clock } from 'lucide-react';

interface HappyHour {
  day_of_week: number;
  happy_hour_start: string;
  happy_hour_end: string;
}

interface RestaurantHappyHoursProps {
  happyHours: HappyHour[];
}

// Helper function to get day name from day number
const getDayName = (dayNumber: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber] || '';
};

// Helper function to format time
const formatTime = (timeString: string): string => {
  const time = new Date(`1970-01-01T${timeString}`);
  return time.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const RestaurantHappyHours: React.FC<RestaurantHappyHoursProps> = ({ happyHours }) => {
  // Sort happy hours by day of week for display
  const sortedHappyHours = happyHours.sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-primary border-b-2 border-amber-500/20 pb-1">Happy Hours</h2>
      </div>
      <div className="space-y-2">
        {sortedHappyHours.length > 0 ? (
          sortedHappyHours.map((happyHour) => (
            <div key={happyHour.day_of_week} className="flex justify-between items-center">
              <span className="text-foreground font-medium">{getDayName(happyHour.day_of_week)}:</span>
              <span className="text-amber-600 font-semibold">
                {formatTime(happyHour.happy_hour_start)} - {formatTime(happyHour.happy_hour_end)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground italic">No happy hour information available</p>
        )}
      </div>
    </div>
  );
};

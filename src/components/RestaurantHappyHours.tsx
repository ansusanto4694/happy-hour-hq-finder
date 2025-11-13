
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
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-amber-600" />
        <h2 className="text-lg font-bold text-foreground">Happy Hours</h2>
      </div>
      <div className="space-y-3">
        {sortedHappyHours.length > 0 ? (
          sortedHappyHours.map((happyHour) => (
            <div 
              key={happyHour.day_of_week} 
              className="flex justify-between items-center py-2 px-3 rounded-lg bg-amber-50/50 border border-amber-100/50 hover:bg-amber-50 transition-colors"
            >
              <span className="text-foreground font-semibold text-sm">{getDayName(happyHour.day_of_week)}</span>
              <span className="text-amber-600 font-semibold text-sm">
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
